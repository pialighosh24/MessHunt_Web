import { useEffect, useRef, useState } from 'react'
import { MHApi } from '../services/api'
import { formatDate, showToast } from '../services/ui'
import * as MHLocations from '../data/locations'

function badgeClass(status) {
  const map = { approved: 'success', pending: 'warn', rejected: 'danger', suspended: 'danger', available: 'success', unavailable: 'gray', accepted: 'success', cancelled: 'gray' }
  return `badge ${map[status] || 'gray'}`
}
function Badge({ status }) { return <span className={badgeClass(status)}>{status || ''}</span> }
function csvToArr(v) { return (v || '').split(',').map(s => s.trim()).filter(Boolean) }
function arrToCsv(v) { return Array.isArray(v) ? v.join(', ') : '' }

const emptyForm = {
  listingId: '', name: '', accommodationType: 'Boys', price: '', securityDeposit: '', city: '', area: '', address: '', description: '',
  availabilityStatus: 'available', roomSharing: 'Not specified', furnishing: 'Not specified', bathroomType: 'Not specified',
  selfCooking: 'Not specified', kitchenAccess: 'Not specified', cookingGas: 'Not specified', inductionCooking: 'Not specified',
  foodIncluded: 'Not specified', foodPreference: 'Not specified', breakfast: 'Not specified', lunch: 'Not specified', dinner: 'Not specified',
  waterSupply: 'Not specified', electricityCharges: 'Not specified', wifi: 'Not specified', laundry: 'Not specified', parking: 'Not specified', studyTable: 'Not specified',
  facilitiesExtra: '', nearCollege: '', nearBus: '', nearRailway: '', phone: '', whatsapp: '', email: '', mapUrl: '', lat: '', lng: '', rules: '', images: ''
}

function listingToForm(m) {
  const facs = (m.facilities || []).map(f => String(f).toLowerCase())
  const has = (needle) => facs.some(f => f.includes(needle))
  const extra = (m.facilities || []).filter(f => !/wi[- ]?fi|laundry|parking|study|attached bathroom/i.test(f))
  return {
    listingId: m._id || '', name: m.name || '', accommodationType: m.accommodationType || (m.gender === 'Co-ed' ? 'Unisex' : m.gender) || 'Boys',
    price: m.price ?? '', securityDeposit: m.securityDeposit ?? '', city: m.city || '', area: m.area || '', address: m.address || '', description: m.description || '',
    availabilityStatus: m.availabilityStatus || 'available', roomSharing: m.roomSharing || m.roomType || 'Not specified',
    furnishing: m.furnishing || 'Not specified', bathroomType: m.bathroomType || 'Not specified',
    selfCooking: m.selfCooking || 'Not specified', kitchenAccess: m.kitchenAccess || 'Not specified', cookingGas: m.cookingGas || 'Not specified', inductionCooking: m.inductionCooking || 'Not specified',
    foodIncluded: m.foodIncluded || 'Not specified', foodPreference: m.foodPreference || m.foodType || 'Not specified',
    breakfast: m.breakfast || 'Not specified', lunch: m.lunch || 'Not specified', dinner: m.dinner || 'Not specified',
    waterSupply: m.waterSupply || 'Not specified', electricityCharges: m.electricityCharges || 'Not specified',
    wifi: has('wi-fi') || has('wifi') ? 'Available' : 'Not specified', laundry: has('laundry') ? 'Available' : 'Not specified',
    parking: has('parking') ? 'Available' : 'Not specified', studyTable: has('study') ? 'Available' : 'Not specified',
    facilitiesExtra: arrToCsv(extra), nearCollege: m.nearby?.college || '', nearBus: m.nearby?.busStand || '', nearRailway: m.nearby?.railwayStation || '',
    phone: m.contactPhone || '', whatsapp: m.whatsapp || '', email: m.contactEmail || '', mapUrl: m.location?.mapUrl || '',
    lat: m.location?.lat ?? '', lng: m.location?.lng ?? '', rules: arrToCsv(m.rules), images: arrToCsv(m.images)
  }
}

function formToPayload(f) {
  const facs = new Set(csvToArr(f.facilitiesExtra))
  ;[['wifi','Wi-Fi'],['laundry','Laundry'],['parking','Parking'],['studyTable','Study Table']].forEach(([k,label]) => { if (f[k] === 'Available') facs.add(label) })
  if (f.bathroomType === 'Attached bathroom') facs.add('Attached bathroom')
  const payload = {
    name: f.name.trim(), accommodationType: f.accommodationType, price: Number(f.price),
    securityDeposit: f.securityDeposit !== '' ? Number(f.securityDeposit) : null,
    city: f.city.trim(), area: f.area.trim(), address: f.address.trim(), description: f.description.trim(),
    availabilityStatus: f.availabilityStatus, roomSharing: f.roomSharing, roomType: f.roomSharing === 'Single' ? 'Single' : 'Shared',
    furnishing: f.furnishing, bathroomType: f.bathroomType, selfCooking: f.selfCooking, kitchenAccess: f.kitchenAccess,
    cookingGas: f.cookingGas, inductionCooking: f.inductionCooking, foodIncluded: f.foodIncluded, foodPreference: f.foodPreference,
    breakfast: f.breakfast, lunch: f.lunch, dinner: f.dinner, waterSupply: f.waterSupply, electricityCharges: f.electricityCharges,
    facilities: Array.from(facs),
    nearby: { college: f.nearCollege.trim(), busStand: f.nearBus.trim(), railwayStation: f.nearRailway.trim() },
    contactPhone: f.phone.trim(), whatsapp: f.whatsapp.trim(), contactEmail: f.email.trim(),
    lat: f.lat !== '' ? Number(f.lat) : null, lng: f.lng !== '' ? Number(f.lng) : null, mapUrl: f.mapUrl.trim(),
    rules: csvToArr(f.rules), images: csvToArr(f.images),
  }
  payload.gender = payload.accommodationType === 'Unisex' ? 'Co-ed' : payload.accommodationType
  payload.foodType = payload.foodPreference !== 'Not specified' ? payload.foodPreference : ''
  payload.foodAvailable = !(payload.foodIncluded === 'Not available' || payload.foodPreference === 'No food')
  return payload
}

async function uploadFilesToServer(files) {
  const fd = new FormData()
  Array.from(files).forEach(file => fd.append('images', file))
  const token = MHApi.getToken()
  const res = await fetch(`${MHApi.API_BASE}/api/uploads/images`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Upload failed')
  return (data.data || []).map(item => item.url)
}

export default function OwnerDashboard() {
  const [alert, setAlert] = useState({ msg: '', type: 'error' })
  const [stats, setStats] = useState(null)
  const [listings, setListings] = useState([])
  const [bookings, setBookings] = useState([])
  const [reviews, setReviews] = useState([])
  const [loadingListings, setLoadingListings] = useState(true)
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [bookingNotes, setBookingNotes] = useState({})
  const quickPhotoInputRef = useRef(null)
  const quickUploadTarget = useRef({ id: null, btn: null })

  const alertBox = (msg = '', type = 'error') => setAlert({ msg, type })
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const loadStats = async () => { try { const res = await MHApi.request('/api/owner/dashboard'); setStats(res.data || {}) } catch (e) { console.error('Stats error:', e) } }
  const loadListings = async () => {
    setLoadingListings(true)
    try { const res = await MHApi.request('/api/messes/owner/mine'); setListings(res.data || []) }
    catch (e) { showToast(e.message || 'Failed to load listings', 'error') }
    finally { setLoadingListings(false) }
  }
  const loadOwnerBookings = async () => {
    setLoadingBookings(true)
    try {
      let res; try { res = await MHApi.request('/api/owner/bookings') } catch { res = await MHApi.request('/api/bookings/mine') }
      const items = res.data || []; setBookings(items)
      const notes = {}; items.forEach(b => { notes[b._id] = b.ownerNote || '' }); setBookingNotes(notes)
    } catch (e) { showToast(e.message || 'Failed to load bookings', 'error') }
    finally { setLoadingBookings(false) }
  }
  const loadOwnerReviews = async () => {
    setLoadingReviews(true)
    try { const res = await MHApi.request('/api/owner/reviews'); setReviews(res.data || []) }
    catch (e) { showToast(e.message || 'Failed to load reviews', 'error') }
    finally { setLoadingReviews(false) }
  }

  useEffect(() => {
    document.title = 'Owner Dashboard | MessHunt'
    ;(async () => { try { await Promise.all([loadStats(), loadListings(), loadOwnerBookings(), loadOwnerReviews()]) } catch (e) { alertBox(e.message || 'Failed to load dashboard.') } })()
  }, [])

  const resetForm = () => { setForm({ ...emptyForm }); alertBox('') }
  const openCreate = () => { resetForm(); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const openEdit = (id) => {
    const m = listings.find(x => String(x._id) === String(id)); if (!m) return
    setForm(listingToForm(m)); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const deleteListing = async (id) => {
    if (!window.confirm('Delete this listing?')) return
    try { await MHApi.request(`/api/messes/${encodeURIComponent(id)}`, { method: 'DELETE' }); showToast('Listing deleted', 'success'); await Promise.all([loadStats(), loadListings(), loadOwnerBookings(), loadOwnerReviews()]) }
    catch (e) { showToast(e.message || 'Failed to delete', 'error') }
  }

  const onFormSubmit = async (e) => {
    e.preventDefault(); alertBox('')
    const payload = formToPayload(form)
    try {
      if (form.listingId) { await MHApi.request(`/api/messes/${encodeURIComponent(form.listingId)}`, { method: 'PUT', body: JSON.stringify(payload) }); showToast('Listing updated successfully', 'success') }
      else { await MHApi.request('/api/messes', { method: 'POST', body: JSON.stringify(payload) }); showToast('Listing created and published', 'success') }
      resetForm(); setShowForm(false); await Promise.all([loadStats(), loadListings()])
    } catch (err) { alertBox(err.message || 'Failed to save listing') }
  }

  const handlePhotoFiles = async (e) => {
    const files = e.target.files; if (!files || !files.length) return
    try {
      showToast('Uploading photo(s)...', 'info')
      const uploadedUrls = await uploadFilesToServer(files)
      const existing = csvToArr(form.images)
      const combined = Array.from(new Set([...existing, ...uploadedUrls]))
      setF('images', arrToCsv(combined))
      e.target.value = ''
      showToast(`${uploadedUrls.length} photo(s) added! Click "Save Listing" to publish.`, 'success')
    } catch (err) { showToast(err.message || 'Failed to upload photos', 'error') }
  }

  const removeFormPhoto = (idx) => {
    const current = csvToArr(form.images); current.splice(idx, 1); setF('images', arrToCsv(current))
  }

  const triggerQuickUpload = (id, btn) => { quickUploadTarget.current = { id, btn }; quickPhotoInputRef.current?.click() }
  const handleQuickPhoto = async (e) => {
    const files = e.target.files; const { id, btn } = quickUploadTarget.current
    if (!files || !files.length || !id) return
    const m = listings.find(x => String(x._id) === String(id))
    const origText = btn?.textContent
    if (btn) { btn.disabled = true; btn.textContent = 'Uploading...' }
    try {
      const uploadedUrls = await uploadFilesToServer(files)
      const existing = Array.isArray(m?.images) ? m.images.filter(Boolean) : []
      await MHApi.request(`/api/messes/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ images: [...existing, ...uploadedUrls] }) })
      showToast(`${uploadedUrls.length} photo(s) uploaded and saved to ${m?.name || 'listing'}!`, 'success')
      await loadListings()
    } catch (err) { showToast(err.message || 'Failed to upload photos', 'error') }
    finally { if (btn) { btn.disabled = false; btn.textContent = origText || '📷 Upload Photos' }; e.target.value = '' }
  }

  const updateBooking = async (id, status) => {
    const note = (bookingNotes[id] || '').trim()
    try {
      await MHApi.request(`/api/bookings/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status, ownerNote: note }) })
      showToast(`Booking ${status} successfully`, 'success')
      await Promise.all([loadStats(), loadOwnerBookings()])
    } catch (e) { showToast(e.message || 'Failed to update booking', 'error') }
  }

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return
    try { await MHApi.request(`/api/reviews/${encodeURIComponent(id)}`, { method: 'DELETE' }); showToast('Review deleted', 'success'); await Promise.all([loadStats(), loadOwnerReviews(), loadListings()]) }
    catch (e) { showToast(e.message || 'Failed to delete review', 'error') }
  }

  const handleRefresh = async (fn, msg) => { try { await fn(); if (msg) showToast(msg, 'success') } catch (e) { showToast(e.message || 'Refresh failed', 'error') } }

  const autoDetectCoords = () => {
    const text = [form.address, form.area, form.nearCollege, form.city].filter(Boolean).join(', ')
    if (!text) return showToast('Please enter an Area, Address, or City first', 'error')
    const coords = MHLocations.inferCoordinates ? MHLocations.inferCoordinates(text) : { lat: 22.4235, lng: 87.3210 }
    setForm(f => ({ ...f, lat: coords.lat, lng: coords.lng, mapUrl: f.mapUrl || ([f.name, f.address || f.area, f.city || 'Midnapore', 'West Bengal'].filter(Boolean).join(', ') ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([f.name, f.address || f.area, f.city || 'Midnapore', 'West Bengal'].filter(Boolean).join(', '))}` : f.mapUrl) }))
    showToast(`Coordinates auto-filled: ${coords.lat}, ${coords.lng}`, 'success')
  }
  const useOwnerGps = () => {
    if (!navigator.geolocation) return showToast('Geolocation not supported by browser', 'error')
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = Number(pos.coords.latitude.toFixed(5)); const lng = Number(pos.coords.longitude.toFixed(5))
      setForm(f => ({ ...f, lat, lng })); showToast(`GPS coordinates set: ${lat}, ${lng}`, 'success')
    }, () => showToast('Unable to access GPS location', 'error'))
  }

  const formPhotoUrls = csvToArr(form.images)
  const s = stats || {}; const l = s.listings || {}; const b = s.bookings || {}

  return (
    <main className="page-wrap">
      <div className="page-header">
        <div><div className="eyebrow">MESS OWNER PORTAL</div><h1>Owner Dashboard</h1><p>Manage your listings, booking requests and reviews.</p></div>
        <button className="btn btn-primary" id="newListingBtn" onClick={openCreate}>+ New Listing</button>
      </div>
      <div id="ownerAlert">{alert.msg ? <div className={`alert ${alert.type}`}>{alert.msg}</div> : null}</div>

      <section className="grid-4" id="statsGrid">
        <div className="stat-card"><div className="label">Total Listings</div><div className="value" id="stTotal">{stats ? (l.total ?? 0) : '-'}</div></div>
        <div className="stat-card"><div className="label">Approved</div><div className="value" id="stApproved">{stats ? (l.approved ?? 0) : '-'}</div></div>
        <div className="stat-card"><div className="label">Pending</div><div className="value" id="stPending">{stats ? (l.pending ?? 0) : '-'}</div></div>
        <div className="stat-card"><div className="label">Bookings (Pending)</div><div className="value" id="stBookings">{stats ? `${b.total ?? 0} (${b.pending ?? 0} pending)` : '-'}</div></div>
      </section>

      <section className="panel" id="listingFormPanel" style={{ display: showForm ? 'block' : 'none', marginTop: '16px' }}>
        <div className="panel-header"><h2 id="listingFormTitle">{form.listingId ? 'Edit Listing' : 'Create Listing'}</h2><button className="btn btn-light" id="cancelListingEdit" onClick={() => { resetForm(); setShowForm(false) }}>Cancel</button></div>
        <form id="listingForm" onSubmit={onFormSubmit}>
          <input type="hidden" id="listingId" value={form.listingId} readOnly />
          <h3>Basic Information</h3>
          <div className="form-grid">
            <div><label>Mess/Hostel Name *</label><input id="mName" required value={form.name} onChange={e => setF('name', e.target.value)} /></div>
            <div><label>Accommodation Type *</label><select id="mAccommodationType" required value={form.accommodationType} onChange={e => setF('accommodationType', e.target.value)}><option value="Boys">Boys</option><option value="Girls">Girls</option><option value="Unisex">Unisex</option></select></div>
            <div><label>Monthly Rent (₹) *</label><input id="mPrice" type="number" min="0" required value={form.price} onChange={e => setF('price', e.target.value)} /></div>
            <div><label>Security Deposit (₹, optional)</label><input id="mSecurityDeposit" type="number" min="0" placeholder="Leave blank if not specified" value={form.securityDeposit} onChange={e => setF('securityDeposit', e.target.value)} /></div>
            <div><label>Town/City</label><input id="mCity" placeholder="e.g. Midnapore, Kharagpur" value={form.city} onChange={e => setF('city', e.target.value)} /></div>
            <div><label>Area/Locality</label><input id="mArea" placeholder="e.g. Kharagpur, Tantigeria" value={form.area} onChange={e => setF('area', e.target.value)} /></div>
            <div style={{ gridColumn: '1/-1' }}><label>Full Address</label><input id="mAddress" placeholder="Full address" value={form.address} onChange={e => setF('address', e.target.value)} /></div>
            <div style={{ gridColumn: '1/-1' }}><label>Short Description</label><textarea id="mDesc" rows="3" placeholder="Describe the accommodation" value={form.description} onChange={e => setF('description', e.target.value)}></textarea></div>
            <div><label>Availability</label><select id="mAvailability" value={form.availabilityStatus} onChange={e => setF('availabilityStatus', e.target.value)}><option value="available">Available</option><option value="unavailable">Unavailable</option></select></div>
          </div>

          <h3 style={{ marginTop: '16px' }}>Room Information</h3>
          <div className="form-grid">
            <div><label>Room Sharing</label><select id="mRoomSharing" value={form.roomSharing} onChange={e => setF('roomSharing', e.target.value)}><option>Not specified</option><option>Single</option><option>Double</option><option>Triple</option><option>Multiple sharing</option></select></div>
            <div><label>Furnishing</label><select id="mFurnishing" value={form.furnishing} onChange={e => setF('furnishing', e.target.value)}><option>Not specified</option><option>Furnished</option><option>Unfurnished</option></select></div>
            <div><label>Bathroom Type</label><select id="mBathroomType" value={form.bathroomType} onChange={e => setF('bathroomType', e.target.value)}><option>Not specified</option><option>Attached bathroom</option><option>Common bathroom</option></select></div>
          </div>

          <h3 style={{ marginTop: '16px' }}>Self-cooking & Kitchen</h3>
          <div className="form-grid">
            <div><label>Self-cooking Facility</label><select id="mSelfCooking" value={form.selfCooking} onChange={e => setF('selfCooking', e.target.value)}><option>Not specified</option><option>Available</option><option>Not available</option></select></div>
            <div><label>Kitchen Access</label><select id="mKitchenAccess" value={form.kitchenAccess} onChange={e => setF('kitchenAccess', e.target.value)}><option>Not specified</option><option>Private</option><option>Shared</option><option>Not available</option></select></div>
            <div><label>Cooking Gas</label><select id="mCookingGas" value={form.cookingGas} onChange={e => setF('cookingGas', e.target.value)}><option>Not specified</option><option>Available</option><option>Not available</option></select></div>
            <div><label>Induction Cooking</label><select id="mInductionCooking" value={form.inductionCooking} onChange={e => setF('inductionCooking', e.target.value)}><option>Not specified</option><option>Available</option><option>Not available</option></select></div>
          </div>

          <h3 style={{ marginTop: '16px' }}>Food Information</h3>
          <div className="form-grid">
            <div><label>Food Included</label><select id="mFoodIncluded" value={form.foodIncluded} onChange={e => setF('foodIncluded', e.target.value)}><option>Not specified</option><option>Included in rent</option><option>Charged separately</option><option>Not available</option></select></div>
            <div><label>Food Preference</label><select id="mFoodPreference" value={form.foodPreference} onChange={e => setF('foodPreference', e.target.value)}><option>Not specified</option><option>Veg</option><option>Non-veg</option><option>Both</option></select></div>
            <div><label>Breakfast</label><select id="mBreakfast" value={form.breakfast} onChange={e => setF('breakfast', e.target.value)}><option>Not specified</option><option>Available</option><option>Not available</option></select></div>
            <div><label>Lunch</label><select id="mLunch" value={form.lunch} onChange={e => setF('lunch', e.target.value)}><option>Not specified</option><option>Available</option><option>Not available</option></select></div>
            <div><label>Dinner</label><select id="mDinner" value={form.dinner} onChange={e => setF('dinner', e.target.value)}><option>Not specified</option><option>Available</option><option>Not available</option></select></div>
          </div>

          <h3 style={{ marginTop: '16px' }}>Facilities & Utilities</h3>
          <div className="form-grid">
            <div><label>Wi-Fi</label><select id="mWifi" value={form.wifi} onChange={e => setF('wifi', e.target.value)}><option>Not specified</option><option>Available</option><option>Not available</option></select></div>
            <div><label>Water Supply</label><select id="mWaterSupply" value={form.waterSupply} onChange={e => setF('waterSupply', e.target.value)}><option>Not specified</option><option>Available</option><option>Not available</option></select></div>
            <div><label>Electricity Charges</label><select id="mElectricityCharges" value={form.electricityCharges} onChange={e => setF('electricityCharges', e.target.value)}><option>Not specified</option><option>Included</option><option>Extra</option></select></div>
            <div><label>Laundry</label><select id="mLaundry" value={form.laundry} onChange={e => setF('laundry', e.target.value)}><option>Not specified</option><option>Available</option><option>Not available</option></select></div>
            <div><label>Parking</label><select id="mParking" value={form.parking} onChange={e => setF('parking', e.target.value)}><option>Not specified</option><option>Available</option><option>Not available</option></select></div>
            <div><label>Study Table</label><select id="mStudyTable" value={form.studyTable} onChange={e => setF('studyTable', e.target.value)}><option>Not specified</option><option>Available</option><option>Not available</option></select></div>
          </div>
          <label>Additional Facilities (comma separated, optional)</label><input id="mFacilitiesExtra" placeholder="e.g. CCTV, Power Backup" value={form.facilitiesExtra} onChange={e => setF('facilitiesExtra', e.target.value)} />

          <h3 style={{ marginTop: '16px' }}>Nearby Places (owner-provided, optional)</h3>
          <div className="form-grid">
            <div><label>Nearby College/University</label><input id="mNearCollege" placeholder="e.g. Near Vidyasagar University" value={form.nearCollege} onChange={e => setF('nearCollege', e.target.value)} /></div>
            <div><label>Nearby Bus Stand</label><input id="mNearBus" placeholder="e.g. Near Kharagpur Bus Stand" value={form.nearBus} onChange={e => setF('nearBus', e.target.value)} /></div>
            <div><label>Nearby Railway Station</label><input id="mNearRailway" placeholder="e.g. Near Kharagpur Railway Station" value={form.nearRailway} onChange={e => setF('nearRailway', e.target.value)} /></div>
          </div>
          <p className="field-hint">Provide only accurate nearby information. Do not claim proximity without reliable knowledge.</p>

          <h3 style={{ marginTop: '16px' }}>Contact & Location</h3>
          <div className="form-grid">
            <div><label>Contact Phone</label><input id="mPhone" value={form.phone} onChange={e => setF('phone', e.target.value)} /></div>
            <div><label>WhatsApp</label><input id="mWhatsapp" value={form.whatsapp} onChange={e => setF('whatsapp', e.target.value)} /></div>
            <div><label>Contact Email</label><input id="mEmail" type="email" value={form.email} onChange={e => setF('email', e.target.value)} /></div>
            <div><label>Map URL (optional — auto-generated if left blank)</label><input id="mMapUrl" placeholder="https://maps.google.com/..." value={form.mapUrl} onChange={e => setF('mapUrl', e.target.value)} /></div>
            <div><label>Latitude (optional — auto-detected from area if blank)</label><input id="mLat" type="number" step="any" placeholder="e.g. 22.4304" value={form.lat} onChange={e => setF('lat', e.target.value)} /></div>
            <div><label>Longitude (optional — auto-detected from area if blank)</label><input id="mLng" type="number" step="any" placeholder="e.g. 87.3025" value={form.lng} onChange={e => setF('lng', e.target.value)} /></div>
          </div>
          <div className="form-actions" style={{ marginTop: '6px', marginBottom: '10px' }}>
            <button className="btn btn-light" type="button" id="autoDetectCoordsBtn" onClick={autoDetectCoords}>📍 Auto-Fill Coordinates from Address/Area</button>
            <button className="btn btn-light" type="button" id="useOwnerGpsBtn" onClick={useOwnerGps}>🎯 Use My Current GPS Location</button>
          </div>
          <label>House Rules (comma separated, optional)</label><input id="mRules" placeholder="e.g. No smoking, Gate closes at 10 PM" value={form.rules} onChange={e => setF('rules', e.target.value)} />

          <h3 style={{ marginTop: '16px' }}>Mess & Room Photos</h3>
          <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '12px', marginBottom: '10px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>📷 Upload Actual Mess & Room Photos from Computer / Phone</label>
            <input type="file" id="mPhotoFiles" accept="image/*" multiple style={{ marginBottom: '6px' }} onChange={handlePhotoFiles} />
            <div className="field-hint">Select one or more photos (JPG, PNG, WEBP) of the mess building, rooms, dining area, or facilities. They will be uploaded and shown on the card and details gallery.</div>
            <div id="mPhotoPreviewGrid" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
              {formPhotoUrls.map((url, idx) => (
                <div key={`${url}-${idx}`} style={{ position: 'relative', width: '100px', height: '75px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #d1d5db' }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.opacity = '0.3' }} />
                  <button type="button" onClick={() => removeFormPhoto(idx)} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(220,38,38,0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', cursor: 'pointer', lineHeight: '20px', textAlign: 'center' }}>×</button>
                </div>
              ))}
            </div>
          </div>
          <label>Image URLs / Uploaded Photo Paths (comma separated, optional)</label><input id="mImages" placeholder="uploads/messes/room1.jpg, https://..." value={form.images} onChange={e => setF('images', e.target.value)} />

          <div className="form-actions"><button className="btn btn-primary" type="submit">Save Listing</button></div>
          <p className="small-note">Saved listings are published immediately to search results and plotted on the interactive map.</p>
        </form>
        <input type="file" id="quickPhotoInput" ref={quickPhotoInputRef} accept="image/*" multiple style={{ display: 'none' }} onChange={handleQuickPhoto} />
      </section>

      <section className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-header"><h2>My Listings</h2><button className="btn btn-light" id="refreshListings" onClick={() => handleRefresh(async () => { await Promise.all([loadStats(), loadListings()]) }, 'My Listings refreshed')}>Refresh</button></div>
        <div id="myListings" className="list">
          {loadingListings ? <div className="loading-state">Loading listings...</div>
            : listings.length === 0 ? <div className="empty-state">No listings yet. Click "New Listing" to create one.</div>
            : listings.map(m => (
              <div className="list-item" key={m._id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0 }}>{m.name}</h3>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}><Badge status={m.approvalStatus} /><Badge status={m.availabilityStatus} /></div>
                </div>
                <div className="muted" style={{ marginTop: '4px' }}>₹{Number(m.price || 0)} • {[m.area, m.city].filter(Boolean).join(', ') || 'N/A'} • ⭐ {Number(m.averageRating || 0).toFixed(1)} ({m.reviewCount || 0})</div>
                {m.rejectionReason ? <div className="small-note" style={{ marginTop: '6px' }}><strong>Admin note:</strong> {m.rejectionReason}</div> : null}
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {(Array.isArray(m.images) && m.images.length) ? (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {m.images.slice(0, 4).map((img, i) => <img key={i} src={img} alt="" style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }} onError={e => { e.currentTarget.style.display = 'none' }} />)}
                      {m.images.length > 4 ? <span className="muted" style={{ fontSize: '0.8rem', alignSelf: 'center' }}>+{m.images.length - 4} more</span> : null}
                    </div>
                  ) : <span className="muted" style={{ fontSize: '0.82rem' }}>No photos uploaded yet</span>}
                </div>
                <div className="form-actions">
                  <a className="btn btn-light" href={`/details.html?id=${encodeURIComponent(m._id)}`}>View</a>
                  <button className="btn btn-light" onClick={(e) => triggerQuickUpload(m._id, e.currentTarget)}>📷 Upload Photos</button>
                  <button className="btn btn-primary" onClick={() => openEdit(m._id)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => deleteListing(m._id)}>Delete</button>
                </div>
              </div>
            ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header"><h2>Booking Requests</h2><button className="btn btn-light" id="refreshOwnerBookings" onClick={() => handleRefresh(async () => { await Promise.all([loadStats(), loadOwnerBookings()]) }, 'Booking requests refreshed')}>Refresh</button></div>
        <div id="ownerBookings" className="list">
          {loadingBookings ? <div className="loading-state">Loading bookings...</div>
            : bookings.length === 0 ? <div className="empty-state">No booking requests from students yet. When any student submits a visit request on a mess page, it will appear here.</div>
            : bookings.map(bk => {
              const isAccepted = bk.status === 'accepted'; const isRejected = bk.status === 'rejected'; const isPending = bk.status === 'pending'
              const studentName = bk.studentName || bk.student?.name || 'Student'
              const studentPhone = bk.studentPhone || bk.student?.phone || ''
              const studentEmail = bk.studentEmail || bk.student?.email || ''
              const messId = bk.mess?._id || ''
              return (
                <div className="list-item" key={bk._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>{bk.mess?.name || 'Mess'}</h3><div><Badge status={bk.status} /></div>
                  </div>
                  <div className="muted" style={{ marginTop: '4px' }}>
                    <strong>Student:</strong> {studentName}
                    {studentPhone ? <> • 📞 <a href={`tel:${studentPhone}`}>{studentPhone}</a></> : null}
                    {studentEmail ? <> • ✉️ <a href={`mailto:${studentEmail}`}>{studentEmail}</a></> : null}
                  </div>
                  <div style={{ marginTop: '6px' }}><strong>Preferred Visit:</strong> {bk.visitDate || ''} {bk.visitTime ? `• ${bk.visitTime}` : ''}</div>
                  {bk.message ? <div style={{ marginTop: '4px' }}><strong>Student Message:</strong> {bk.message}</div> : null}
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input type="text" value={bookingNotes[bk._id] ?? ''} onChange={e => setBookingNotes(n => ({ ...n, [bk._id]: e.target.value }))} placeholder="Optional note to student (e.g. Visit confirmed between 10 AM - 12 PM)..." style={{ flex: 1, minWidth: '220px', padding: '7px 10px', border: '1px solid #d9e1ec', borderRadius: '8px', fontSize: '0.88rem' }} />
                  </div>
                  <div className="form-actions" style={{ marginTop: '8px' }}>
                    <button type="button" className="btn btn-primary" disabled={isAccepted} style={isAccepted ? { opacity: 0.65, cursor: 'default' } : undefined} onClick={() => updateBooking(bk._id, 'accepted')}>{isAccepted ? '✓ Accepted' : 'Accept'}</button>
                    <button type="button" className="btn btn-warning" disabled={isRejected} style={isRejected ? { opacity: 0.65, cursor: 'default' } : undefined} onClick={() => updateBooking(bk._id, 'rejected')}>{isRejected ? '✗ Rejected' : 'Reject'}</button>
                    <button type="button" className="btn btn-light" disabled={isPending} style={isPending ? { opacity: 0.65, cursor: 'default' } : undefined} onClick={() => updateBooking(bk._id, 'pending')}>{isPending ? '• Pending' : 'Mark Pending'}</button>
                    <button type="button" className="btn btn-light" onClick={() => updateBooking(bk._id, bk.status || 'pending')}>Save Note</button>
                    {messId ? <a className="btn btn-light" href={`/details.html?id=${encodeURIComponent(messId)}`}>View Mess</a> : null}
                  </div>
                </div>
              )
            })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header"><h2>Reviews on My Listings</h2><button className="btn btn-light" id="refreshOwnerReviews" onClick={() => handleRefresh(async () => { await Promise.all([loadStats(), loadOwnerReviews(), loadListings()]) }, 'Student reviews refreshed')}>Refresh</button></div>
        <div id="ownerReviews" className="list">
          {loadingReviews ? <div className="loading-state">Loading reviews...</div>
            : reviews.length === 0 ? <div className="empty-state">No student reviews yet. When students write a review on any listing page, it will appear here in real time.</div>
            : reviews.map(r => {
              const rawRating = Number(r.rating) || 0
              const starCount = Math.max(0, Math.min(5, Math.round(rawRating)))
              const stars = '★'.repeat(starCount) + '☆'.repeat(5 - starCount)
              const messId = r.mess?._id || ''
              const studentEmail = r.user?.email || ''
              return (
                <div className="list-item" key={r._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>{r.mess?.name || 'Mess'}</h3>
                    <span style={{ fontWeight: 700, color: '#f59e0b' }}>⭐ {rawRating.toFixed(1)} / 5 <span style={{ fontSize: '0.95rem', letterSpacing: '1px' }}>{stars}</span></span>
                  </div>
                  <div className="muted" style={{ marginTop: '4px' }}>
                    Student: <strong>{r.user?.name || 'Student'}</strong>{studentEmail ? ` (${studentEmail})` : ''} • {formatDate(r.createdAt)}
                    {r.isHidden ? <span className="badge danger">Hidden by Admin</span> : null}
                  </div>
                  <p style={{ marginTop: '6px', color: '#334155' }}>{r.comment || 'No comment provided.'}</p>
                  <div className="form-actions" style={{ marginTop: '8px' }}>
                    {messId ? <a className="btn btn-light" href={`/details.html?id=${encodeURIComponent(messId)}#reviewsPanel`}>View on Mess Page</a> : null}
                    <button type="button" className="btn btn-danger" onClick={() => deleteReview(r._id)}>Delete Review</button>
                  </div>
                </div>
              )
            })}
        </div>
      </section>
    </main>
  )
}
