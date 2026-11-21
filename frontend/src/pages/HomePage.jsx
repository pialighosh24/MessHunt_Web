import { useCallback, useEffect, useRef, useState } from 'react'
import { MHApi } from '../services/api'
import { MHLocations } from '../data/locations'
import { escapeHtml } from '../services/ui'

function cardImage(mess) {
  const raw = (mess.images && mess.images[0]) ? String(mess.images[0]).trim() : ''
  if (!raw) return '/assets/logo.svg'
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:') || raw.startsWith('/')) return raw
  return `/${raw}`
}

function displayAccommodation(mess) {
  return mess.accommodationType || (mess.gender === 'Co-ed' ? 'Unisex' : mess.gender) || 'Not specified'
}

function displayFood(mess) {
  if (mess.foodIncluded === 'Not available' || mess.foodAvailable === false) return 'No food'
  return mess.foodPreference && mess.foodPreference !== 'Not specified' ? mess.foodPreference : (mess.foodType || 'Not specified')
}

function MessCard({ mess, onLocate }) {
  const facilities = (mess.facilities || []).slice(0, 4)
  const addr = String(mess.address || '').trim()
  const area = String(mess.area || '').trim()
  const city = String(mess.city || '').trim()
  const locationParts = []
  if (area && !addr.toLowerCase().includes(area.toLowerCase())) locationParts.push(area)
  if (addr) locationParts.push(addr)
  if (city && !addr.toLowerCase().includes(city.toLowerCase())) locationParts.push(city)
  const locationText = locationParts.join(', ') || 'Location not specified'
  const hasCustomPhoto = Boolean(mess.images && mess.images[0] && !String(mess.images[0]).includes('assets/logo'))
  const imgStyle = hasCustomPhoto ? { objectFit: 'cover', padding: 0 } : { objectFit: 'contain', padding: '18px', background: '#eef3f9' }
  const hasCoords = mess.location && mess.location.lat != null && mess.location.lng != null

  return (
    <article className="mess-card">
      <div className="mess-image">
        <img
          src={cardImage(mess)}
          alt={mess.name || 'Mess'}
          style={imgStyle}
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/logo.svg'; e.currentTarget.style.objectFit = 'contain'; e.currentTarget.style.padding = '18px' }}
        />
        <div className="rating">⭐ {Number(mess.averageRating || 0).toFixed(1)}</div>
        <div className="mess-type">{displayAccommodation(mess)}</div>
      </div>
      <div className="mess-content">
        <h3>{mess.name}</h3>
        <p className="mess-location">📍 {locationText}</p>
        <div className="facility-tags">
          {facilities.length ? facilities.map((f, i) => <span className="tag" key={`${f}-${i}`}>{f}</span>) : <span className="tag muted">No facilities listed</span>}
        </div>
        <div className="mess-details">
          <div className="detail-item"><small>Monthly Rent</small><strong>₹{Number(mess.price || 0)}</strong></div>
          <div className="detail-item"><small>Accommodation</small><strong>{displayAccommodation(mess)}</strong></div>
          <div className="detail-item"><small>Food</small><strong>{displayFood(mess)}</strong></div>
          <div className="detail-item"><small>Availability</small><strong>{mess.availabilityStatus === 'available' ? 'Available' : 'Unavailable'}</strong></div>
        </div>
        <div className="card-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a className="btn btn-light" href={`details.html?id=${encodeURIComponent(mess._id)}`}>View Details</a>
          {hasCoords && onLocate && (
            <button className="btn btn-light" type="button" onClick={() => onLocate(mess._id)}>📍 Locate on Map</button>
          )}
        </div>
      </div>
    </article>
  )
}

function AutocompleteList({ items, open, onSelect }) {
  if (!open || !items.length) return null
  return (
    <div className="autocomplete-list open" role="listbox">
      {items.map((loc) => (
        <div
          key={loc.name}
          className="autocomplete-item"
          role="option"
          tabIndex={0}
          onMouseDown={(e) => { e.preventDefault(); onSelect(loc.name) }}
          onKeyDown={(e) => { if (e.key === 'Enter') onSelect(loc.name) }}
        >
          <div className="loc-name">{loc.name}</div>
          <div className="loc-meta">{loc.district || ''}{loc.note ? ` • ${loc.note}` : ''}</div>
        </div>
      ))}
    </div>
  )
}

export default function HomePage() {
  const [heroSearch, setHeroSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [accommodationType, setAccommodationType] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [foodPreference, setFoodPreference] = useState('')
  const [nearby, setNearby] = useState('')
  const [facilityChecks, setFacilityChecks] = useState({ 'Wi-Fi': false, 'Attached bathroom': false, 'Laundry': false, 'Parking': false })

  const [locAcOpen, setLocAcOpen] = useState(false)
  const [locAcItems, setLocAcItems] = useState([])

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [meta, setMeta] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [mapLegend, setMapLegend] = useState('')

  const limit = 24
  const mapRef = useRef(null)
  const markersLayerRef = useRef(null)
  const markerByIdRef = useRef({})
  const mapElRef = useRef(null)
  const reqSeq = useRef(0)
  const currentFiltersRef = useRef(null)

  const getSelectedFacilities = useCallback(() => {
    return Object.entries(facilityChecks).filter(([, v]) => v).map(([k]) => k)
  }, [facilityChecks])

  const collectFilters = useCallback((pageOverride = page, overrides = null) => {
    const base = {
      search: heroSearch.trim(),
      location: locationFilter.trim(),
      accommodationType,
      minPrice,
      maxPrice,
      foodPreference,
      nearby,
      facilities: getSelectedFacilities().join(','),
      sort: 'newest',
      page: pageOverride,
      limit,
    }
    return overrides ? { ...base, ...overrides, page: pageOverride, limit } : base
  }, [heroSearch, locationFilter, accommodationType, minPrice, maxPrice, foodPreference, nearby, getSelectedFacilities, page])

  const initMap = useCallback(() => {
    if (mapRef.current || !window.L || !mapElRef.current) return
    try {
      const map = window.L.map(mapElRef.current, { scrollWheelZoom: false }).setView([22.425, 87.32], 10)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map)
      const layer = window.L.layerGroup().addTo(map)
      mapRef.current = map
      markersLayerRef.current = layer
    } catch {
      if (mapElRef.current) mapElRef.current.innerHTML = '<div class="empty-state">Map could not be loaded. Please try again later.</div>'
    }
  }, [])

  const updateMap = useCallback((list) => {
    initMap()
    const map = mapRef.current
    const layer = markersLayerRef.current
    if (!map || !layer) {
      setMapLegend('Map is unavailable.')
      return
    }
    layer.clearLayers()
    const mappable = (list || []).filter(m => m && m.location && m.location.lat != null && m.location.lng != null && !Number.isNaN(Number(m.location.lat)) && !Number.isNaN(Number(m.location.lng)))
    if (!mappable.length) {
      map.setView([22.425, 87.32], 9)
      setMapLegend('No listings with valid map coordinates in current results. Listings without coordinates are still shown in the list.')
      setTimeout(() => { try { map.invalidateSize() } catch {} }, 0)
      return
    }
    const bounds = []
    markerByIdRef.current = {}
    mappable.forEach(m => {
      const lat = Number(m.location.lat)
      const lng = Number(m.location.lng)
      bounds.push([lat, lng])
      const popup = `<div style="min-width:180px"><strong>${escapeHtml(m.name)}</strong><br><span>${escapeHtml([m.area, m.city].filter(Boolean).join(', '))}</span><br><span>₹${Number(m.price || 0)}/month • ${escapeHtml(displayAccommodation(m))}</span><br><a href="details.html?id=${encodeURIComponent(m._id)}">View details</a></div>`
      const marker = window.L.marker([lat, lng]).addTo(layer).bindPopup(popup)
      markerByIdRef.current[String(m._id)] = { marker, lat, lng }
    })
    try { map.fitBounds(bounds, { padding: [20, 20], maxZoom: 14 }) } catch {}
    setMapLegend(`${mappable.length} listing(s) shown on map. Click "📍 Locate on Map" on any card to highlight its pin.`)
    setTimeout(() => { try { map.invalidateSize() } catch {} }, 0)
  }, [initMap])

  const focusMessOnMap = useCallback((id) => {
    const entry = markerByIdRef.current[String(id)]
    const map = mapRef.current
    if (!entry || !map) return
    mapElRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => {
      map.setView([entry.lat, entry.lng], 16, { animate: true })
      entry.marker.openPopup()
    }, 250)
  }, [])

  const loadMesses = useCallback(async (pageOverride = 1, filtersOverride = null) => {
    const seq = ++reqSeq.current
    setLoading(true)
    setError('')
    try {
      const filters = collectFilters(pageOverride, filtersOverride)
      currentFiltersRef.current = filters
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) params.set(k, v) })
      const res = await MHApi.request(`/api/messes?${params.toString()}`)
      if (seq !== reqSeq.current) return
      const list = res.data || []
      const p = res.pagination || { total: list.length, page: 1, pages: 1 }
      setItems(list)
      setPage(p.page || 1)
      setTotalPages(p.pages || 1)
      setMeta(`${p.total || 0} listing(s) found • Page ${p.page || 1} of ${p.pages || 1}`)
      updateMap(list)
    } catch (e) {
      if (seq !== reqSeq.current) return
      setItems([])
      setError(`Failed to load listings: ${e.message || 'Unknown error'}`)
      setMeta('')
      updateMap([])
    } finally {
      if (seq === reqSeq.current) setLoading(false)
    }
  }, [collectFilters, updateMap])

  useEffect(() => {
    initMap()
    loadMesses(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try { mapRef.current.remove() } catch {}
        mapRef.current = null
        markersLayerRef.current = null
      }
    }
  }, [])

  const applyFilters = (scroll = true) => {
    loadMesses(1)
    if (scroll) document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })
  }

  const clearAllFilters = () => {
    setHeroSearch('')
    setLocationFilter('')
    setAccommodationType('')
    setMinPrice('')
    setMaxPrice('')
    setFoodPreference('')
    setNearby('')
    setFacilityChecks({ 'Wi-Fi': false, 'Attached bathroom': false, 'Laundry': false, 'Parking': false })
    loadMesses(1, {
      search: '',
      location: '',
      accommodationType: '',
      minPrice: '',
      maxPrice: '',
      foodPreference: '',
      nearby: '',
      facilities: '',
      sort: 'newest',
    })
  }

  const runHeroSearch = (valOverride) => {
    const q = (typeof valOverride === 'string' ? valOverride : heroSearch).trim()
    setLocationFilter('')
    setAccommodationType('')
    setMinPrice('')
    setMaxPrice('')
    setFoodPreference('')
    setNearby('')
    setFacilityChecks({ 'Wi-Fi': false, 'Attached bathroom': false, 'Laundry': false, 'Parking': false })
    loadMesses(1, {
      search: q,
      location: '',
      accommodationType: '',
      minPrice: '',
      maxPrice: '',
      foodPreference: '',
      nearby: '',
      facilities: '',
      sort: 'newest',
    })
    document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })
  }

  const onHeroSearchChange = (v) => {
    setHeroSearch(v)
    if (v.trim() === '') {
      loadMesses(1, { search: '' })
    }
  }
  const onLocationFilterChange = (v) => {
    setLocationFilter(v)
    setLocAcItems(MHLocations.searchLocations(v))
    setLocAcOpen(true)
  }

  const selectFilterLocation = (name) => {
    setLocationFilter(name)
    setLocAcOpen(false)
    loadMesses(1, { location: name })
  }

  return (
    <>
      <main>
        <section className="hero" id="search-section">
          <div className="hero-content">
            <div className="eyebrow">WEST MEDINIPUR • STUDENT ACCOMMODATION</div>
            <h1>Find a mess that feels like <span style={{ color: 'var(--accent)' }}>home</span>.</h1>
            <p>Discover, compare and book student-friendly mess accommodations.</p>

            <div className="hero-search-wrap">
              <div className="hero-search">
                <input
                  type="text"
                  id="heroSearch"
                  placeholder="Search by mess name..."
                  autoComplete="off"
                  aria-label="Search by mess name"
                  value={heroSearch}
                  onChange={(e) => onHeroSearchChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runHeroSearch() } }}
                />
                <button className="btn btn-primary" id="heroSearchBtn" type="button" onClick={() => runHeroSearch()}>Search Messes</button>
              </div>
            </div>

            <p className="field-hint" style={{ marginTop: '6px' }}>Enter a mess name (e.g. Uttaran Mess, Puspak Mess) and click Search Messes.</p>
          </div>
          <div className="hero-visual simple-visual">
            <div className="hero-card-highlight">
              <h3>Why MessHunt?</h3>
              <ul>
                <li>Focused on Paschim Medinipur locations</li>
                <li>Compare rent, facilities, food and room details</li>
                <li>View verified listing information and reviews</li>
                <li>Send booking requests without online payment</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="explore" className="section explore-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">EXPLORE</div>
              <h2>Search & Filter Listings</h2>
              <p>Use simple filters to find suitable accommodation. Results are loaded from the database.</p>
            </div>
          </div>

          <div className="filter-panel">
            <div className="filter-grid">
              <div className="filter-group" style={{ position: 'relative' }}>
                <label className="filter-label" htmlFor="locationFilter">1. Location</label>
                <input
                  type="text"
                  id="locationFilter"
                  placeholder="Select or type location (e.g. Kharagpur)"
                  autoComplete="off"
                  value={locationFilter}
                  onChange={(e) => onLocationFilterChange(e.target.value)}
                  onFocus={() => { setLocAcItems(MHLocations.searchLocations(locationFilter)); setLocAcOpen(true) }}
                  onBlur={() => setTimeout(() => setLocAcOpen(false), 150)}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(true) }}
                />
                <AutocompleteList items={locAcItems} open={locAcOpen} onSelect={selectFilterLocation} />
              </div>

              <div className="filter-group">
                <label className="filter-label" htmlFor="accommodationTypeFilter">2. Accommodation type</label>
                <select id="accommodationTypeFilter" value={accommodationType} onChange={(e) => setAccommodationType(e.target.value)}>
                  <option value="">Any</option>
                  <option value="Boys">Boys</option>
                  <option value="Girls">Girls</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>

              <div className="filter-group">
                <span className="filter-label">3. Monthly budget (₹)</span>
                <div className="filter-inline">
                  <input type="number" id="minPrice" min="0" placeholder="Min rent" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                  <input type="number" id="maxPrice" min="0" placeholder="Max rent" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                </div>
              </div>

              <div className="filter-group">
                <label className="filter-label" htmlFor="foodPreferenceFilter">4. Food preference</label>
                <select id="foodPreferenceFilter" value={foodPreference} onChange={(e) => setFoodPreference(e.target.value)}>
                  <option value="">Any</option>
                  <option value="Veg">Veg</option>
                  <option value="Non-veg">Non-veg</option>
                  <option value="Both">Both</option>
                  <option value="No food">No food</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label" htmlFor="nearbyFilter">5. Nearby places</label>
                <select id="nearbyFilter" value={nearby} onChange={(e) => setNearby(e.target.value)}>
                  <option value="">Any</option>
                  <option value="college">College / University</option>
                  <option value="bus">Bus stand</option>
                  <option value="railway">Railway station</option>
                </select>
                <div className="field-hint">Shows listings where the owner has provided nearby place information.</div>
              </div>

              <div className="filter-group">
                <span className="filter-label">6. Facilities</span>
                <div className="checkbox-group" id="facilityFilters">
                  {['Wi-Fi', 'Attached bathroom', 'Laundry', 'Parking'].map((fac) => (
                    <label className="checkbox-item" key={fac}>
                      <input
                        type="checkbox"
                        value={fac}
                        checked={!!facilityChecks[fac]}
                        onChange={(e) => setFacilityChecks(prev => ({ ...prev, [fac]: e.target.checked }))}
                      /> {fac}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="filter-actions">
              <button className="btn btn-primary" id="applyFiltersBtn" type="button" onClick={() => applyFilters(true)}>Apply Filters</button>
              <button className="btn btn-light" id="clearFiltersBtn" type="button" onClick={clearAllFilters}>Clear All</button>
            </div>
          </div>

          <div id="resultsMeta" className="results-meta">{meta}</div>

          <div className="map-section" id="mapSection">
            <div className="panel-header" style={{ marginBottom: '8px' }}>
              <h3 style={{ margin: 0 }}>Map View</h3>
              <span className="muted" id="mapMeta">Listings with valid coordinates will appear on the map.</span>
            </div>
            <div id="resultsMap" className="map-canvas" aria-label="Listings map" ref={mapElRef}></div>
            <div className="map-legend" id="mapLegend">{mapLegend}</div>
          </div>

          <div className="mess-grid" id="messGrid">
            {loading && <div className="loading-state">Loading listings...</div>}
            {!loading && error && <div className="error-state">{error}</div>}
            {!loading && !error && items.map((m) => <MessCard key={m._id} mess={m} onLocate={focusMessOnMap} />)}
          </div>
          {!loading && !error && items.length === 0 && (
            <div className="no-results" id="noResults" style={{ display: 'block' }}>No mess listings found. Try changing your search or filters.</div>
          )}

          <div className="pagination" id="pagination">
            {totalPages > 1 && (
              <>
                <button className="btn btn-light" disabled={page <= 1} onClick={() => { const p = page - 1; if (p >= 1) { loadMesses(p); document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } }}>Prev</button>
                <span className="page-info">Page {page} of {totalPages}</span>
                <button className="btn btn-light" disabled={page >= totalPages} onClick={() => { const p = page + 1; if (p <= totalPages) { loadMesses(p); document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } }}>Next</button>
              </>
            )}
          </div>
        </section>

        <section id="how" className="section how-section">
          <div className="center-heading">
            <div className="eyebrow">HOW IT WORKS</div>
            <h2>Simple steps for students</h2>
          </div>
          <div className="feature-grid">
            <div className="feature-card"><div className="feature-icon">🔎</div><h3>Search & Filter</h3><p>Find listings by location, budget, food, nearby places and facilities.</p></div>
            <div className="feature-card"><div className="feature-icon">🏠</div><h3>Compare Details</h3><p>Check room, kitchen/self-cooking, food, facilities, photos and map location.</p></div>
            <div className="feature-card"><div className="feature-icon">❤️</div><h3>Save Favourites</h3><p>Login as a student to save listings and manage your profile.</p></div>
            <div className="feature-card"><div className="feature-icon">📅</div><h3>Request Booking</h3><p>Send a booking request to the owner and track status from your dashboard.</p></div>
          </div>
        </section>
      </main>
    </>
  )
}
