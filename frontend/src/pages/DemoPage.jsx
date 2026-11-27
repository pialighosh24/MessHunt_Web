import { useEffect, useState } from 'react'
import { showToast } from '../services/ui'

const DEMO_PHOTOS = [
  {
    src: '/uploads/demo/dream-mess-exterior.jpg',
    title: 'Building Exterior & Front Gate',
    caption: 'Photo 1 of 5 • Dream Mess ("Feel Like Home...") — 3-Storey Girls Mess Building Exterior'
  },
  {
    src: '/uploads/demo/dream-mess-room-1.jpg',
    title: 'Single Furnished Room & Study Table',
    caption: 'Photo 2 of 5 • Spacious Single-Occupancy Room with Wooden Bed, Study Table, Chair, Window & Fan'
  },
  {
    src: '/uploads/demo/dream-mess-room-2.jpg',
    title: 'Bright Student Bedroom Interior',
    caption: 'Photo 3 of 5 • Well-Ventilated Student Room with Beds, Storage Shelves, Curtains & Ceiling Fan'
  },
  {
    src: '/uploads/demo/dream-mess-dining.jpg',
    title: 'Hygienic Mess Dining Hall',
    caption: 'Photo 4 of 5 • Spacious Common Dining Hall with Granite Tables, Steel Chairs & Ceiling Fans'
  },
  {
    src: '/uploads/demo/dream-mess-kitchen.jpg',
    title: 'Self-Cooking Student Kitchen',
    caption: 'Photo 5 of 5 • Clean Kitchen Facility with LPG Gas Stove, Sink, Running Water & Utensil Racks'
  }
]

const COLLEGE_LOCATIONS = {
  kgp: {
    label: 'Near Kharagpur College, Inda, Kharagpur - 721305, West Bengal',
    area: 'Inda (Near Kharagpur College)',
    city: 'Kharagpur',
    lat: 22.3543,
    lng: 87.3357,
    college: 'Kharagpur College & IIT Kharagpur',
    busStand: 'Inda College More Bus Stop',
    railwayStation: 'Kharagpur Junction Railway Station'
  },
  vu: {
    label: 'Near Vidyasagar University / Midnapore College, Midnapore - 721102, West Bengal',
    area: 'Tantigeria / Raja Bazar',
    city: 'Midnapore',
    lat: 22.4310,
    lng: 87.2980,
    college: 'Vidyasagar University & Midnapore College',
    busStand: 'Vidyasagar University Gate Bus Stop',
    railwayStation: 'Midnapore Railway Station'
  },
  rnlkwc: {
    label: "Near RNLKWC (Raja Narendra Lal Khan Women's College), Gope Palace, Midnapore - 721102, West Bengal",
    area: 'Gope Palace (Near RNLKWC)',
    city: 'Midnapore',
    lat: 22.4277,
    lng: 87.3046,
    college: "Raja Narendra Lal Khan Women's College (RNLKWC)",
    busStand: 'Gope Palace / RNLKWC Gate Bus Stop',
    railwayStation: 'Midnapore Railway Station'
  }
}

function InfoRow({ k, v, badge }) {
  return (
    <div className="row">
      <div className="k">{k}</div>
      <div className="v">
        {v}
        {badge ? <span className="demo-tag-inline" style={{ marginLeft: '8px' }}>{badge}</span> : null}
      </div>
    </div>
  )
}

export default function DemoPage() {
  const [photoIdx, setPhotoIdx] = useState(0)
  const [locPreset, setLocPreset] = useState('kgp')
  const [liveCoords, setLiveCoords] = useState(null)
  const [liveAddress, setLiveAddress] = useState('')
  const [demoBookingDone, setDemoBookingDone] = useState(false)
  const [demoVisitDate, setDemoVisitDate] = useState(() => new Date().toISOString().split('T')[0])
  const [demoVisitTime, setDemoVisitTime] = useState('Morning (10:00 AM - 12:00 PM)')
  const [demoStudentName, setDemoStudentName] = useState('')
  const [demoStudentPhone, setDemoStudentPhone] = useState('')

  useEffect(() => {
    document.title = 'Demo Mode — Dream Mess | MessHunt'
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setPhotoIdx((i) => (i + 1) % DEMO_PHOTOS.length)
      if (e.key === 'ArrowLeft') setPhotoIdx((i) => (i - 1 + DEMO_PHOTOS.length) % DEMO_PHOTOS.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const prevPhoto = () => setPhotoIdx((i) => (i - 1 + DEMO_PHOTOS.length) % DEMO_PHOTOS.length)
  const nextPhoto = () => setPhotoIdx((i) => (i + 1) % DEMO_PHOTOS.length)

  const currentLoc = COLLEGE_LOCATIONS[locPreset]
  const activeLat = liveCoords ? liveCoords.lat : currentLoc.lat
  const activeLng = liveCoords ? liveCoords.lng : currentLoc.lng
  const activeAddress = liveAddress || currentLoc.label
  const delta = 0.004
  const bbox = `${(activeLng - delta).toFixed(5)},${(activeLat - delta).toFixed(5)},${(activeLng + delta).toFixed(5)},${(activeLat + delta).toFixed(5)}`
  const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${activeLat},${activeLng}`
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${activeLat},${activeLng}`)}`

  const useMyLiveLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5))
        const lng = Number(pos.coords.longitude.toFixed(5))
        setLiveCoords({ lat, lng })
        showToast(`Map updated to your current GPS location (${lat}, ${lng})`, 'success')
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
          if (r.ok) {
            const data = await r.json()
            if (data?.display_name) {
              setLiveAddress(data.display_name.split(',').slice(0, 4).join(',').trim())
            }
          }
        } catch {
          // keep preset address label if reverse geocode fails
        }
      },
      () => showToast('Unable to access your browser location. Showing college location on map.', 'error'),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const currentPhoto = DEMO_PHOTOS[photoIdx]

  return (
    <main className="details-layout">
      <div className="demo-mode-banner" role="region" aria-label="Demo Mode Notice">
        <div className="demo-mode-banner-left">
          <span className="demo-pill-badge">✨ DEMO MODE • SAMPLE DATA</span>
          <div>
            <strong>Interactive Demo Showcase — Dream Mess ("Feel Like Home...")</strong>
            <p>
              This is a dedicated sample listing for visitors to explore photographs, room &amp; food details, owner contact options, and map location without logging in. Kept completely separate from real owner listings.
            </p>
          </div>
        </div>
        <div className="demo-mode-banner-actions">
          <a className="btn btn-light" href="/index.html#explore">← Back to Real Listings</a>
        </div>
      </div>

      <section className="panel" id="messHeaderPanel">
        <div className="page-header" style={{ marginBottom: '8px' }}>
          <div>
            <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>DEMO MESS SHOWCASE • GIRLS ACCOMMODATION</span>
              <span className="demo-tag-inline">SAMPLE LISTING</span>
            </div>
            <h1 style={{ marginBottom: '4px' }}>Dream Mess <span style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--muted)' }}>— Feel Like Home...</span></h1>
            <p>📍 {activeAddress}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge warn">DEMO DATA</span>
            <span className="badge success">Available (5 of 12 Single Rooms Open)</span>
            <span className="badge" style={{ background: '#fce7f3', color: '#9d174d' }}>Girls Only</span>
            <span className="badge warn">⭐ 4.9 (Demo Preview)</span>
          </div>
        </div>
        <p>
          <strong>Dream Mess ("Feel Like Home...")</strong> is a safe, well-maintained 3-storey girls mess accommodation managed by <strong>Ankana Maity</strong>. It offers furnished <strong>Single</strong> occupancy rooms, a clean dining hall serving fresh home-style meals, a self-cooking student kitchen with LPG gas &amp; utensils, 24/7 water supply, high-speed Wi-Fi, and CCTV security near college campus.
        </p>
      </section>

      <section className="panel" id="galleryPanel">
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ marginBottom: '2px' }}>Mess, Room, Dining &amp; Kitchen Photographs (5 Separate Views)</h2>
            <p className="small-note" style={{ margin: 0 }}>Click the <strong>&lt;</strong> or <strong>&gt;</strong> buttons (or any thumbnail below) to view each photograph separately.</p>
          </div>
          <span className="demo-photo-counter">{photoIdx + 1} / {DEMO_PHOTOS.length} • {currentPhoto.title}</span>
        </div>

        <div className="demo-carousel-stage">
          <button
            type="button"
            className="demo-carousel-arrow prev"
            onClick={prevPhoto}
            aria-label="Previous photograph"
            title="Previous photo (<)"
          >
            &#10094;
          </button>

          <div className="demo-carousel-image-wrap">
            <img
              className="demo-carousel-ambient-bg"
              src={`${currentPhoto.src}?v=hd`}
              alt=""
              aria-hidden="true"
            />
            <img
              id="mainGalleryImage"
              className="demo-carousel-main-img"
              src={`${currentPhoto.src}?v=hd`}
              alt={currentPhoto.title}
            />
            <div className="demo-carousel-caption-bar">
              <span>{currentPhoto.caption}</span>
              <span className="demo-tag-inline">HD DEMO PHOTO</span>
            </div>
          </div>

          <button
            type="button"
            className="demo-carousel-arrow next"
            onClick={nextPhoto}
            aria-label="Next photograph"
            title="Next photo (>)"
          >
            &#10095;
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-light" onClick={prevPhoto}>← Previous Photo (&lt;)</button>
          <button type="button" className="btn btn-primary" onClick={nextPhoto}>Next Photo (&gt;) →</button>
        </div>

        <div id="thumbRow" className="demo-thumb-grid" style={{ marginTop: '14px' }}>
          {DEMO_PHOTOS.map((item, idx) => (
            <button
              key={item.src}
              type="button"
              className={`demo-thumb-card ${idx === photoIdx ? 'active' : ''}`}
              onClick={() => setPhotoIdx(idx)}
            >
              <img src={item.src} alt={item.title} />
              <span>{idx + 1}. {item.title}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel info-sections" id="detailsInfoPanel">
        <div className="info-section">
          <h2>Basic Information <span className="demo-tag-inline">DEMO DATA</span></h2>
          <div className="info-table">
            <InfoRow k="Mess / Hostel Name" v="Dream Mess (Feel Like Home...)" badge="SAMPLE" />
            <InfoRow k="Accommodation Type" v="Girls (Female Students Only)" />
            <InfoRow k="Room Sharing" v="Single Occupancy" />
            <InfoRow k="No. of Rooms" v="12 Single Rooms (5 Rooms Currently Available)" />
            <InfoRow k="Monthly Rent" v="₹3,500 / month" />
            <InfoRow k="Security Deposit" v="₹3,000 (Refundable)" />
            <InfoRow k="Full Address" v={activeAddress} />
            <InfoRow k="Town / City" v={currentLoc.city} />
            <InfoRow k="Area / Locality" v={currentLoc.area} />
            <InfoRow k="Current Availability" v="Available" />
          </div>
        </div>

        <div className="info-section">
          <h2>Room Information</h2>
          <div className="info-table">
            <InfoRow k="Room Sharing" v="Single" />
            <InfoRow k="No. of Rooms" v="12 Furnished Rooms across 3 Floors (4 Rooms per Floor)" />
            <InfoRow k="Furnishing" v="Fully Furnished (Wooden Bed, Mattress, Pillow, Study Table, Chair, Curtains, Ceiling Fan, LED Tube Light & Wall Shelves)" />
            <InfoRow k="Bathroom Type" v="Attached & Clean Common Bathrooms (24/7 Running Water)" />
          </div>
        </div>

        <div className="info-section">
          <h2>Self-Cooking &amp; Kitchen Facilities</h2>
          <div className="info-table">
            <InfoRow k="Self-Cooking Facility" v="Available (Dedicated Student Kitchen Shown in Photo 5)" />
            <InfoRow k="Kitchen Access" v="Allowed for All Residents" />
            <InfoRow k="Cooking Gas (LPG)" v="Available (Double-Burner Gas Stove with Cylinder)" />
            <InfoRow k="Induction &amp; Utensils" v="Allowed (Stainless Steel Utensil Rack & Sink Available)" />
          </div>
        </div>

        <div className="info-section">
          <h2>Food &amp; Dining Hall Information</h2>
          <div className="info-table">
            <InfoRow k="Food Included" v="Included in Monthly Rent (Hygienic Mess Dining Hall Shown in Photo 4)" />
            <InfoRow k="Food Preference" v="Both (Veg & Non-Veg Home-Style Meals)" />
            <InfoRow k="Breakfast" v="Available (7:30 AM – 9:30 AM)" />
            <InfoRow k="Lunch" v="Available (12:30 PM – 2:30 PM)" />
            <InfoRow k="Dinner" v="Available (8:30 PM – 10:00 PM)" />
          </div>
        </div>

        <div className="info-section">
          <h2>Main Facilities &amp; Utilities</h2>
          <div className="info-table">
            <InfoRow k="Water Supply" v="24/7 Running Water + RO Drinking Water" />
            <InfoRow k="Electricity Charges" v="Included in Rent (24/7 Power Backup)" />
            <InfoRow k="Daily Cleaning" v="Regular Room, Bathroom & Dining Hall Sanitization" />
          </div>
          <h3 style={{ marginTop: '10px' }}>Included Facilities</h3>
          <div className="facility-list">
            {['High-Speed Wi-Fi', 'Single Furnished Rooms', 'Study Table & Chair', 'RO Drinking Water', '24/7 CCTV Security', 'Spacious Dining Hall', 'Self-Cooking Kitchen', 'Attached Bathroom', 'Power Backup', 'Two-Wheeler Parking'].map((f) => (
              <span className="facility-pill" key={f}>{f}</span>
            ))}
          </div>
          <h3 style={{ marginTop: '12px' }}>House Rules</h3>
          <ul style={{ margin: '6px 0 0 18px', color: 'var(--text)', lineHeight: 1.7 }}>
            <li>Exclusively for female students — valid College ID &amp; Aadhaar card required at admission.</li>
            <li>Main gate entry timing: 9:30 PM (late entry allowed with prior guardian/owner notice).</li>
            <li>Maintain silence during evening study hours (7:00 PM – 11:00 PM).</li>
            <li>Keep the self-cooking kitchen and dining hall tidy after use.</li>
          </ul>
        </div>

        <div className="info-section">
          <h2>Nearby Places &amp; Campus Connectivity</h2>
          <div className="info-table">
            <InfoRow k="Nearby College / University" v={currentLoc.college} />
            <InfoRow k="Nearby Bus Stand" v={currentLoc.busStand} />
            <InfoRow k="Nearby Railway Station" v={currentLoc.railwayStation} />
          </div>
        </div>

        <div className="info-section">
          <h2>Owner &amp; Contact Information <span className="demo-tag-inline">DIRECT OWNER CONTACT</span></h2>
          <div className="info-table">
            <InfoRow k="Owner / Proprietor Name" v="Ankana Maity" />
            <div className="row">
              <div className="k">Mobile Number</div>
              <div className="v">
                <a href="tel:9002843948" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'underline' }}>
                  📞 +91 9002843948
                </a>
              </div>
            </div>
            <div className="row">
              <div className="k">WhatsApp</div>
              <div className="v">
                <a target="_blank" rel="noopener noreferrer" href="https://wa.me/919002843948" style={{ color: '#15803d', fontWeight: 600 }}>
                  💬 +91 9002843948
                </a>
              </div>
            </div>
            <div className="row">
              <div className="k">Email Address</div>
              <div className="v">
                <a href="mailto:maityankana@gmail.com" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>
                  ✉️ maityankana@gmail.com
                </a>
              </div>
            </div>
          </div>
          <div className="contact-links" style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a className="btn btn-primary" href="tel:9002843948">📞 Call Owner (+91 9002843948)</a>
            <a className="btn btn-light" target="_blank" rel="noopener noreferrer" href="https://wa.me/919002843948">💬 WhatsApp Owner</a>
            <a className="btn btn-light" href="mailto:maityankana@gmail.com">✉️ Email Owner (maityankana@gmail.com)</a>
          </div>
        </div>
      </section>

      <section className="panel" id="locationPanel">
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h2>Map &amp; Location (College / Current GPS Location)</h2>
          <span className="demo-tag-inline">INTERACTIVE MAP</span>
        </div>
        <p style={{ marginBottom: '10px' }}>📍 {activeAddress}</p>
        <iframe className="map-frame" title="Dream Mess Demo Location" src={osmSrc}></iframe>
        <div className="form-actions" style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-light" onClick={useMyLiveLocation}>
            📍 Use My Current GPS Location
          </button>
          <button
            type="button"
            className="btn btn-light"
            onClick={() => { setLiveCoords(null); setLiveAddress(''); setLocPreset('kgp'); showToast('Switched map to Kharagpur College location', 'info') }}
          >
            🎓 Kharagpur College Location
          </button>
          <button
            type="button"
            className="btn btn-light"
            onClick={() => { setLiveCoords(null); setLiveAddress(''); setLocPreset('vu'); showToast('Switched map to Vidyasagar University / Midnapore College location', 'info') }}
          >
            🎓 Midnapore / V.U. College Location
          </button>
          <button
            type="button"
            className="btn btn-light"
            onClick={() => { setLiveCoords(null); setLiveAddress(''); setLocPreset('rnlkwc'); showToast("Switched map to RNLKWC (Raja Narendra Lal Khan Women's College) location", 'info') }}
          >
            🎓 RNLKWC College Location
          </button>
          <a className="btn btn-primary" target="_blank" rel="noopener noreferrer" href={googleMapsUrl}>
            Open Exact Location in Google Maps
          </a>
        </div>
        <p className="small-note" style={{ marginTop: '8px' }}>
          Coordinates: {activeLat.toFixed(4)}° N, {activeLng.toFixed(4)}° E
        </p>
      </section>

      <section className="panel" id="demoBookingPanel">
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <h2>Try Demo Visit / Booking Request (No Login Required)</h2>
          <span className="demo-tag-inline">SANDBOX PREVIEW</span>
        </div>
        <p className="small-note" style={{ marginBottom: '10px' }}>
          Visitors can test how a student schedules a mess visit here in Demo Mode. Submitting this preview form does not modify real database bookings.
        </p>
        {demoBookingDone ? (
          <div className="alert success" style={{ marginBottom: '10px' }}>
            <strong>✓ Demo Visit Request Simulated!</strong> In the live portal, this request is sent to <strong>Ankana Maity (+91 9002843948)</strong> for date <strong>{demoVisitDate}</strong> ({demoVisitTime}).
            <div style={{ marginTop: '8px' }}>
              <button type="button" className="btn btn-light" onClick={() => setDemoBookingDone(false)}>Reset Demo Form</button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setDemoBookingDone(true)
              showToast('Demo visit request preview submitted!', 'success')
            }}
          >
            <div className="form-grid">
              <div>
                <label>Your Name (Demo Preview)</label>
                <input
                  type="text"
                  placeholder="e.g. Riya Sen"
                  value={demoStudentName}
                  onChange={(e) => setDemoStudentName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Your Phone (Demo Preview)</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={demoStudentPhone}
                  onChange={(e) => setDemoStudentPhone(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Preferred Visit Date</label>
                <input
                  type="date"
                  value={demoVisitDate}
                  onChange={(e) => setDemoVisitDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Preferred Time Slot</label>
                <select value={demoVisitTime} onChange={(e) => setDemoVisitTime(e.target.value)}>
                  <option value="Morning (10:00 AM - 12:00 PM)">Morning (10:00 AM - 12:00 PM)</option>
                  <option value="Afternoon (12:00 PM - 3:00 PM)">Afternoon (12:00 PM - 3:00 PM)</option>
                  <option value="Evening (4:00 PM - 7:00 PM)">Evening (4:00 PM - 7:00 PM)</option>
                </select>
              </div>
            </div>
            <div className="form-actions" style={{ marginTop: '10px' }}>
              <button type="submit" className="btn btn-primary">Preview Visit Request (Demo)</button>
            </div>
          </form>
        )}
      </section>
    </main>
  )
}

