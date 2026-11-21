import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MHApi } from '../services/api'
import { showToast, formatDate } from '../services/ui'

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

function val(v) {
  if (v === null || v === undefined || v === '') return 'Not specified'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return String(v)
}
function money(v) { return (v === null || v === undefined || v === '') ? 'Not specified' : `₹${Number(v)}` }
function accType(m) { return m?.accommodationType || (m?.gender === 'Co-ed' ? 'Unisex' : m?.gender) || 'Not specified' }

function InfoRow({ k, v }) {
  return <div className="row"><div className="k">{k}</div><div className="v">{val(v)}</div></div>
}

function Stars({ rating, onChange }) {
  return (
    <div className="stars" id="starPicker" style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" data-star={n} className={n <= rating ? 'active' : ''} onClick={() => onChange(n)}>★</button>
      ))}
      <span id="starRatingLabel" className="muted" style={{ marginLeft: '8px', fontSize: '0.9rem' }}>
        {rating ? `Selected: ${rating} / 5 stars` : 'Click a star to rate (1-5)'}
      </span>
    </div>
  )
}

export default function DetailsPage() {
  const query = useQuery()
  const messId = query.get('id')
  const [mess, setMess] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [mainImage, setMainImage] = useState('/assets/logo.svg')
  const [activeThumb, setActiveThumb] = useState(0)
  const [reviews, setReviews] = useState([])
  const [myReview, setMyReview] = useState(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [myLocationText, setMyLocationText] = useState('')

  const currentUser = (() => { try { return MHApi.getUser() } catch { return null } })()
  const isStudent = currentUser?.role === 'student'

  const loadMess = async (id = messId) => {
    if (!id) {
      setPageError('Invalid listing URL (missing id).')
      setLoading(false)
      return null
    }
    try {
      const res = await MHApi.request(`/api/messes/${encodeURIComponent(id)}`)
      setMess(res.data)
      setPageError('')
      return res.data
    } catch (e) {
      setPageError(e.message || 'Failed to load mess details.')
      setMess(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async (id = messId) => {
    try {
      const res = await MHApi.request(`/api/messes/${encodeURIComponent(id)}/reviews`)
      const list = res.data || []
      setReviews(list)
      const u = (() => { try { return MHApi.getUser() } catch { return null } })()
      const uid = u?._id || u?.id
      const mine = (u && uid) ? list.find(r => String(r.user?._id || r.user) === String(uid)) : null
      setMyReview(mine || null)
      setReviewRating(mine?.rating || 0)
      setReviewComment(mine?.comment || '')
    } catch (e) {
      showToast(e.message || 'Failed to load reviews.', 'error')
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      const m = await loadMess(messId)
      if (mounted && m) await loadReviews(messId, m)
    })()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messId])

  useEffect(() => {
    if (mess?.name) document.title = `${mess.name} | MessHunt`
    else document.title = 'Mess Details | MessHunt'
  }, [mess])

  useEffect(() => {
    const images = (mess?.images && mess.images.length) ? mess.images : []
    if (images.length) { setMainImage(images[0]); setActiveThumb(0) }
    else { setMainImage('/assets/logo.svg'); setActiveThumb(0) }
  }, [mess])

  const refreshMessAndReviews = async () => {
    try {
      const res = await MHApi.request(`/api/messes/${encodeURIComponent(messId)}`)
      setMess(res.data)
    } catch { /* ignore */ }
    await loadReviews(messId)
  }

  const toggleFavourite = async () => {
    if (!isStudent) return showToast('Please login as a student to use favourites.', 'error')
    try {
      const res = await MHApi.request(`/api/messes/${encodeURIComponent(messId)}/favourite/toggle`, { method: 'POST' })
      showToast(res.message || 'Updated favourites.', 'success')
    } catch (e) { showToast(e.message || 'Failed to update favourite.', 'error') }
  }

  const reportTarget = async (targetType, targetId) => {
    const u = (() => { try { return MHApi.getUser() } catch { return null } })()
    if (!u) return showToast('Please login to submit a report.', 'error')
    const reason = window.prompt('Reason for report (required):')
    if (!reason) return
    const details = window.prompt('Additional details (optional):') || ''
    try {
      await MHApi.request('/api/reports', { method: 'POST', body: JSON.stringify({ targetType, targetId, reason, details }) })
      showToast('Report submitted for admin review.', 'success')
    } catch (e) { showToast(e.message || 'Failed to submit report.', 'error') }
  }

  const saveReview = async () => {
    const u = (() => { try { return MHApi.getUser() } catch { return null } })()
    if (!u) return showToast('Please login to submit a review.', 'error')
    const comment = reviewComment.trim()
    if (!reviewRating || !comment) return showToast('Please select a rating and write a comment.', 'error')
    try {
      if (myReview) {
        await MHApi.request(`/api/reviews/${encodeURIComponent(myReview._id)}`, { method: 'PUT', body: JSON.stringify({ rating: reviewRating, comment }) })
        showToast('Review updated.', 'success')
      } else {
        await MHApi.request(`/api/messes/${encodeURIComponent(messId)}/reviews`, { method: 'POST', body: JSON.stringify({ rating: reviewRating, comment }) })
        showToast('Review submitted.', 'success')
      }
      await refreshMessAndReviews()
    } catch (e) { showToast(e.message || 'Failed to save review.', 'error') }
  }

  const deleteMyReview = async () => {
    if (!myReview) return
    if (!window.confirm('Delete your review?')) return
    try {
      await MHApi.request(`/api/reviews/${encodeURIComponent(myReview._id)}`, { method: 'DELETE' })
      setMyReview(null)
      setReviewRating(0)
      setReviewComment('')
      showToast('Review deleted.', 'success')
      await refreshMessAndReviews()
    } catch (e) { showToast(e.message || 'Failed to delete review.', 'error') }
  }

  const submitBooking = async (e) => {
    e.preventDefault()
    setBookingSubmitting(true)
    try {
      await MHApi.request(`/api/messes/${encodeURIComponent(messId)}/bookings`, {
        method: 'POST',
        body: JSON.stringify({
          studentName: e.target.bName.value.trim(),
          studentPhone: e.target.bPhone.value.trim(),
          studentEmail: e.target.bEmail.value.trim(),
          visitDate: e.target.bDate.value,
          visitTime: e.target.bTime.value,
          message: e.target.bMsg.value.trim(),
        })
      })
      showToast('Booking request sent to owner!', 'success')
      e.target.bMsg.value = ''
      setBookingSuccess(true)
    } catch (err) {
      showToast(err.message || 'Failed to submit booking request.', 'error')
    } finally {
      setBookingSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="details-layout">
        <div id="pageAlert"></div>
        <section className="panel" id="messHeaderPanel"><div className="loading-state">Loading mess details...</div></section>
      </main>
    )
  }

  if (pageError) {
    return (
      <main className="details-layout">
        <div id="pageAlert"></div>
        <section className="panel" id="messHeaderPanel"><div className="error-state">{pageError}</div></section>
      </main>
    )
  }

  if (!mess) return null

  const locParts = [mess.address, mess.area, mess.city].filter(Boolean)
  const loc = locParts.join(', ') || 'Not specified'
  const images = (mess.images && mess.images.length) ? mess.images : []
  const phone = mess.contactPhone || mess.owner?.phone || ''
  const whatsapp = mess.whatsapp || phone || ''
  const email = mess.contactEmail || mess.owner?.email || ''
  const waNum = (whatsapp || '').replace(/[^0-9]/g, '')
  const lat = mess.location?.lat
  const lng = mess.location?.lng
  const placeQuery = [mess.name, mess.address || mess.area, mess.city, 'West Bengal'].filter(Boolean).join(', ')
  const mapLink = mess.location?.mapUrl
    || (placeQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery)}` : '')
    || ((lat && lng) ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat)},${encodeURIComponent(lng)}` : '')

  const hasCoords = lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))
  const nLat = Number(lat)
  const nLng = Number(lng)
  const delta = 0.004
  const bbox = hasCoords ? `${(nLng - delta).toFixed(5)},${(nLat - delta).toFixed(5)},${(nLng + delta).toFixed(5)},${(nLat + delta).toFixed(5)}` : ''
  const osmSrc = hasCoords ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${nLat},${nLng}` : ''

  const avg = reviews.length ? (reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length) : 0
  const today = new Date().toISOString().split('T')[0]

  return (
    <main className="details-layout">
      <div id="pageAlert"></div>

      <section className="panel" id="messHeaderPanel">
        <div className="page-header" style={{ marginBottom: '8px' }}>
          <div>
            <div className="eyebrow">MESS DETAILS</div>
            <h1 style={{ marginBottom: '4px' }}>{mess.name}</h1>
            <p>📍 {loc}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`badge ${mess.availabilityStatus === 'available' ? 'success' : 'gray'}`}>{mess.availabilityStatus === 'available' ? 'Available' : 'Unavailable'}</span>
            <span className="badge warn">⭐ {Number(avg || 0).toFixed(1)} ({reviews.length})</span>
            {isStudent && <button className="btn btn-light" id="favToggleBtn" type="button" onClick={toggleFavourite}>❤ Favourite</button>}
            {isStudent && <button className="btn btn-light" id="reportListingBtn" type="button" onClick={() => reportTarget('mess', mess._id)}>Report Listing</button>}
          </div>
        </div>
        <p>{mess.description || 'No description provided.'}</p>
      </section>

      <section className="panel" id="galleryPanel">
        <div className="panel-header"><h2>Photos</h2></div>
        <img
          id="mainGalleryImage"
          className="gallery-main"
          src={mainImage}
          alt="Accommodation photo"
          onError={(e) => { e.currentTarget.src = '/assets/logo.svg' }}
        />
        <div id="thumbRow" className="thumb-row">
          {images.map((img, i) => (
            <img
              key={`${img}-${i}`}
              src={img}
              className={i === activeThumb ? 'active' : ''}
              alt={`Photo ${i + 1}`}
              onClick={() => { setMainImage(img); setActiveThumb(i) }}
              onError={(e) => { e.currentTarget.remove() }}
            />
          ))}
        </div>
        <p className="small-note" id="photoNote" style={{ marginTop: '8px' }}>
          {images.length ? 'Actual accommodation photos provided by the owner (if available).' : 'No photos available for this listing.'}
        </p>
      </section>

      <section className="panel info-sections" id="detailsInfoPanel">
        <div className="info-section">
          <h2>Basic Information</h2>
          <div className="info-table">
            <InfoRow k="Mess/Hostel Name" v={mess.name} />
            <InfoRow k="Full Address" v={mess.address} />
            <InfoRow k="Town/City" v={mess.city} />
            <InfoRow k="Area/Locality" v={mess.area} />
            <InfoRow k="Accommodation Type" v={accType(mess)} />
            <InfoRow k="Monthly Rent" v={money(mess.price)} />
            <InfoRow k="Security Deposit" v={money(mess.securityDeposit)} />
            <InfoRow k="Current Availability" v={mess.availabilityStatus === 'available' ? 'Available' : 'Unavailable'} />
            <InfoRow k="Short Description" v={mess.description} />
          </div>
        </div>

        <div className="info-section">
          <h2>Room Information</h2>
          <div className="info-table">
            <InfoRow k="Room Sharing" v={mess.roomSharing || mess.roomType} />
            <InfoRow k="Furnishing" v={mess.furnishing} />
            <InfoRow k="Bathroom" v={mess.bathroomType} />
          </div>
        </div>

        <div className="info-section">
          <h2>Self-cooking & Kitchen Facilities</h2>
          <div className="info-table">
            <InfoRow k="Self-cooking Facility" v={mess.selfCooking} />
            <InfoRow k="Kitchen Access" v={mess.kitchenAccess} />
            <InfoRow k="Cooking Gas" v={mess.cookingGas} />
            <InfoRow k="Induction Cooking" v={mess.inductionCooking} />
          </div>
          <p className="small-note" style={{ marginTop: '8px' }}>This section helps students understand whether they can prepare their own food. Information shown as provided by the owner.</p>
        </div>

        <div className="info-section">
          <h2>Food Information</h2>
          <div className="info-table">
            <InfoRow k="Food Included" v={mess.foodIncluded} />
            <InfoRow k="Food Preference" v={mess.foodPreference || mess.foodType} />
            <InfoRow k="Breakfast" v={mess.breakfast} />
            <InfoRow k="Lunch" v={mess.lunch} />
            <InfoRow k="Dinner" v={mess.dinner} />
          </div>
        </div>

        <div className="info-section">
          <h2>Main Facilities & Utilities</h2>
          <div className="info-table">
            <InfoRow k="Water Supply" v={mess.waterSupply} />
            <InfoRow k="Electricity Charges" v={mess.electricityCharges} />
          </div>
          <h3 style={{ marginTop: '10px' }}>Facilities</h3>
          <div className="facility-list">
            {(mess.facilities || []).length
              ? mess.facilities.map((f, i) => <span className="facility-pill" key={`${f}-${i}`}>{f}</span>)
              : <span className="muted">Not specified</span>}
          </div>
        </div>

        <div className="info-section">
          <h2>Nearby Places & Other Information</h2>
          <div className="info-table">
            <InfoRow k="Nearby College/University" v={mess.nearby?.college} />
            <InfoRow k="Nearby Bus Stand" v={mess.nearby?.busStand} />
            <InfoRow k="Nearby Railway Station" v={mess.nearby?.railwayStation} />
          </div>
          <p className="small-note" style={{ marginTop: '8px' }}>Nearby information is shown only when provided by the owner/listing data.</p>
        </div>

        <div className="info-section">
          <h2>Owner & Contact Information</h2>
          <div className="info-table">
            <InfoRow k="Owner Name" v={mess.owner?.name} />
            <InfoRow k="Phone" v={phone} />
            <InfoRow k="WhatsApp" v={whatsapp} />
            <InfoRow k="Email" v={email} />
          </div>
          <div className="contact-links" style={{ marginTop: '10px' }}>
            {phone ? <a className="btn btn-light" href={`tel:${phone}`}>Call</a> : null}
            {waNum ? <a className="btn btn-light" target="_blank" rel="noopener noreferrer" href={`https://wa.me/91${waNum}`}>WhatsApp</a> : null}
            {email ? <a className="btn btn-light" href={`mailto:${email}`}>Email</a> : null}
          </div>
        </div>
      </section>

      <section className="panel" id="locationPanel">
        <div className="panel-header"><h2>Map & Location</h2></div>
        <p style={{ marginBottom: '10px' }}>{loc}</p>
        {hasCoords ? (
          <>
            <iframe className="map-frame" title="Mess Location" src={osmSrc}></iframe>
            <div className="form-actions" style={{ marginTop: '10px' }}>
              <button className="btn btn-light" id="useMyLocationBtn" type="button" onClick={() => {
                if (!navigator.geolocation) return showToast('Geolocation is not supported by your browser.', 'error')
                navigator.geolocation.getCurrentPosition((pos) => {
                  setMyLocationText(`Your location: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}. Use directions to compare distance.`)
                }, () => showToast('Unable to access your location.', 'error'))
              }}>Use My Location</button>
              {mapLink ? <a className="btn btn-primary" target="_blank" rel="noopener noreferrer" href={mapLink}>Open Exact Place in Google Maps</a> : null}
            </div>
            <p id="myLocationText" className="small-note" style={{ marginTop: '8px' }}>
              {myLocationText || `Coordinates: ${nLat.toFixed(4)}° N, ${nLng.toFixed(4)}° E`}
            </p>
          </>
        ) : (
          <>
            <p className="muted">Map coordinates are not available for this listing.</p>
            {mapLink ? <div className="form-actions" style={{ marginTop: '10px' }}><a className="btn btn-primary" target="_blank" rel="noopener noreferrer" href={mapLink}>Search on Google Maps</a></div> : <p className="small-note" style={{ marginTop: '8px' }}>No map link available.</p>}
          </>
        )}
      </section>

      <section className="panel" id="reviewsPanel">
        <div className="panel-header">
          <h2>Reviews & Ratings</h2>
          <div id="ratingSummary" className="muted">Average: {Number(avg).toFixed(1)} / 5 • {reviews.length} review(s)</div>
        </div>
        <div id="reviewFormWrap">
          {!currentUser ? (
            <div className="alert">Please <a className="inline-link" href="/login.html">login</a> as a student to submit or manage your review.</div>
          ) : currentUser.role !== 'student' ? (
            <div className="muted">Reviews can be submitted from student accounts. You are logged in as <strong>{currentUser.role}</strong>.</div>
          ) : (
            <div className="form-card" style={{ padding: '14px' }}>
              <h3>{myReview ? 'Edit Your Review' : 'Write a Review'}</h3>
              <Stars rating={reviewRating} onChange={setReviewRating} />
              <textarea id="reviewComment" rows="3" placeholder="Share your real experience with this mess..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}></textarea>
              <div className="form-actions">
                <button className="btn btn-primary" id="saveReviewBtn" type="button" onClick={saveReview}>{myReview ? 'Update Review' : 'Submit Review'}</button>
                {myReview ? <button className="btn btn-danger" id="deleteMyReviewBtn" type="button" onClick={deleteMyReview}>Delete My Review</button> : null}
              </div>
            </div>
          )}
        </div>
        <div id="reviewsList" className="list" style={{ marginTop: '12px' }}>
          {reviews.length === 0 ? (
            <div className="empty-state">No reviews yet. Be the first to share your experience.</div>
          ) : reviews.map(r => {
            const rid = r._id
            const mine = currentUser && String(r.user?._id || r.user) === String(currentUser._id || currentUser.id)
            const name = r.user?.name || 'User'
            return (
              <div className="list-item" key={rid}>
                <div className="review-item-head">
                  <div><strong>{name}</strong><div className="muted">{'★'.repeat(Number(r.rating || 0))}{'☆'.repeat(5 - Number(r.rating || 0))} • {formatDate(r.createdAt)}</div></div>
                  {r.isHidden ? <span className="badge gray">Hidden</span> : null}
                </div>
                <p style={{ marginTop: '6px', color: '#334155' }}>{r.comment || ''}</p>
                <div className="review-actions">
                  {mine ? <span className="badge success">Your review</span> : null}
                  {currentUser && !mine ? <button className="btn btn-light" type="button" onClick={() => reportTarget('review', rid)}>Report</button> : null}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel" id="bookingPanel">
        <div className="panel-header"><h2>Booking Request</h2></div>
        <div id="bookingWrap">
          {!currentUser ? (
            <div className="alert">Please <a className="inline-link" href="/login.html">login</a> as a student to send a booking request.</div>
          ) : currentUser.role !== 'student' ? (
            <div className="muted">Booking requests can be created from student accounts. You are logged in as <strong>{currentUser.role}</strong>.</div>
          ) : (
            <form id="bookingForm" className="form-card" style={{ padding: '14px' }} onSubmit={submitBooking}>
              <p className="small-note">Send a booking/visit request to the owner. No online payment is required.</p>
              <div className="form-grid">
                <div><label htmlFor="bName">Your Name</label><input id="bName" name="bName" defaultValue={currentUser.name || ''} required /></div>
                <div><label htmlFor="bPhone">Phone</label><input id="bPhone" name="bPhone" defaultValue={currentUser.phone || ''} placeholder="Enter your contact number" required /></div>
                <div><label htmlFor="bEmail">Email</label><input id="bEmail" name="bEmail" type="email" defaultValue={currentUser.email || ''} required /></div>
                <div><label htmlFor="bDate">Preferred Visit Date</label><input id="bDate" name="bDate" type="date" min={today} defaultValue={today} required /></div>
                <div><label htmlFor="bTime">Preferred Time</label>
                  <select id="bTime" name="bTime" defaultValue="Morning (10:00 AM - 12:00 PM)">
                    <option>Morning (10:00 AM - 12:00 PM)</option>
                    <option>Afternoon (12:00 PM - 3:00 PM)</option>
                    <option>Evening (4:00 PM - 7:00 PM)</option>
                  </select>
                </div>
              </div>
              <label htmlFor="bMsg">Message (optional)</label>
              <textarea id="bMsg" name="bMsg" rows="3" placeholder="Any questions or room requirements..."></textarea>
              <div className="form-actions">
                <button className="btn btn-primary" id="submitBookingBtn" type="submit" disabled={bookingSubmitting}>
                  {bookingSubmitting ? 'Submitting...' : 'Submit Booking Request'}
                </button>
              </div>
              <div id="bookingSuccessBox" style={{ display: bookingSuccess ? 'block' : 'none', marginTop: '10px' }}>
                {bookingSuccess && <div className="alert success">Booking request sent to the mess owner! You can track its status in your <a className="inline-link" href="/student-dashboard.html">Student Dashboard</a>.</div>}
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
