// MessHunt landing/discovery: DB-backed search, filters, location autocomplete, map (no membership/payment/AI)
(function () {
  const state = { page: 1, limit: 24, totalPages: 1 };
  let resultsMap = null;
  let markersLayer = null;

  function qs(id) { return document.getElementById(id); }

  function cardImage(mess) {
    return (mess.images && mess.images[0]) ? mess.images[0] : 'assets/logo.svg';
  }

  function displayAccommodation(mess) {
    return mess.accommodationType || (mess.gender === 'Co-ed' ? 'Unisex' : mess.gender) || 'Not specified';
  }

  function displayFood(mess) {
    if (mess.foodIncluded === 'Not available' || mess.foodAvailable === false) return 'No food';
    return mess.foodPreference && mess.foodPreference !== 'Not specified' ? mess.foodPreference : (mess.foodType || 'Not specified');
  }

  function messCard(mess) {
    const facilities = (mess.facilities || []).slice(0, 4).map(f => `<span class="tag">${MHUI.escapeHtml(f)}</span>`).join('');
    const addr = String(mess.address || '').trim();
    const area = String(mess.area || '').trim();
    const city = String(mess.city || '').trim();
    const locationParts = [];
    if (area && !addr.toLowerCase().includes(area.toLowerCase())) locationParts.push(area);
    if (addr) locationParts.push(addr);
    if (city && !addr.toLowerCase().includes(city.toLowerCase())) locationParts.push(city);
    const locationText = locationParts.join(', ') || 'Location not specified';
    const hasCustomPhoto = Boolean(mess.images && mess.images[0] && !String(mess.images[0]).includes('assets/logo'));
    const imgStyle = hasCustomPhoto ? '' : 'style="object-fit:contain;padding:18px;background:#eef3f9;"';
    return `
      <article class="mess-card">
        <div class="mess-image">
          <img src="${MHUI.escapeHtml(cardImage(mess))}" alt="${MHUI.escapeHtml(mess.name)}" ${imgStyle} onerror="this.onerror=null;this.src='assets/logo.svg';this.style.objectFit='contain';this.style.padding='18px';">
          <div class="rating">⭐ ${Number(mess.averageRating || 0).toFixed(1)}</div>
          <div class="mess-type">${MHUI.escapeHtml(displayAccommodation(mess))}</div>
        </div>
        <div class="mess-content">
          <h3>${MHUI.escapeHtml(mess.name)}</h3>
          <p class="mess-location">📍 ${MHUI.escapeHtml(locationText)}</p>
          <div class="facility-tags">${facilities || '<span class="tag muted">No facilities listed</span>'}</div>
          <div class="mess-details">
            <div class="detail-item"><small>Monthly Rent</small><strong>₹${Number(mess.price || 0)}</strong></div>
            <div class="detail-item"><small>Accommodation</small><strong>${MHUI.escapeHtml(displayAccommodation(mess))}</strong></div>
            <div class="detail-item"><small>Food</small><strong>${MHUI.escapeHtml(displayFood(mess))}</strong></div>
            <div class="detail-item"><small>Availability</small><strong>${mess.availabilityStatus === 'available' ? 'Available' : 'Unavailable'}</strong></div>
          </div>
          <div class="card-actions" style="display:flex;gap:8px;flex-wrap:wrap;">
            <a class="btn btn-light" href="details.html?id=${encodeURIComponent(mess._id)}">View Details</a>
            ${(mess.location && mess.location.lat != null && mess.location.lng != null) ? `<button class="btn btn-light" type="button" data-locate-mess="${MHUI.escapeHtml(mess._id)}">📍 Locate on Map</button>` : ''}
          </div>
        </div>
      </article>`;
  }

  function getSelectedFacilities() {
    return Array.from(document.querySelectorAll('#facilityFilters input[type="checkbox"]:checked')).map(c => c.value);
  }

  function collectFilters() {
    const search = (qs('heroSearch')?.value || qs('searchInput')?.value || '').trim();
    const location = (qs('locationFilter')?.value || '').trim();
    return {
      search: search,
      location: location,
      accommodationType: qs('accommodationTypeFilter')?.value || '',
      minPrice: qs('minPrice')?.value || '',
      maxPrice: qs('maxPrice')?.value || '',
      foodPreference: qs('foodPreferenceFilter')?.value || '',
      nearby: qs('nearbyFilter')?.value || '',
      facilities: getSelectedFacilities().join(','),
      sort: qs('sortFilter')?.value || 'newest',
      page: state.page,
      limit: state.limit,
    };
  }

  function setupAutocomplete(inputId, listId, onSelect) {
    const input = qs(inputId);
    const list = qs(listId);
    if (!input || !list || !window.MHLocations) return;

    const render = (items) => {
      if (!items.length) { list.classList.remove('open'); list.innerHTML = ''; return; }
      list.innerHTML = items.map(loc => `
        <div class="autocomplete-item" role="option" data-name="${MHUI.escapeHtml(loc.name)}">
          <div class="loc-name">${MHUI.escapeHtml(loc.name)}</div>
          <div class="loc-meta">${MHUI.escapeHtml(loc.district || '')}${loc.note ? ' • ' + MHUI.escapeHtml(loc.note) : ''}</div>
        </div>`).join('');
      list.classList.add('open');
      list.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('mousedown', (e) => { // mousedown to fire before blur
          e.preventDefault();
          const name = item.getAttribute('data-name');
          input.value = name;
          list.classList.remove('open');
          if (onSelect) onSelect(name);
        });
      });
    };

    input.addEventListener('input', () => {
      render(MHLocations.searchLocations(input.value));
    });
    input.addEventListener('focus', () => {
      render(MHLocations.searchLocations(input.value));
    });
    input.addEventListener('blur', () => {
      setTimeout(() => list.classList.remove('open'), 150);
    });
  }

  function initMap() {
    if (resultsMap || !window.L || !qs('resultsMap')) return;
    try {
      resultsMap = L.map('resultsMap', { scrollWheelZoom: false }).setView([22.425, 87.32], 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(resultsMap);
      markersLayer = L.layerGroup().addTo(resultsMap);
    } catch (e) {
      const el = qs('resultsMap');
      if (el) el.innerHTML = '<div class="empty-state">Map could not be loaded. Please try again later.</div>';
    }
  }

  let markerById = {};

  function updateMap(items) {
    initMap();
    const legend = qs('mapLegend');
    if (!resultsMap || !markersLayer) {
      if (legend) legend.textContent = 'Map is unavailable.';
      return;
    }
    markersLayer.clearLayers();
    markerById = {};
    const mappable = (items || []).filter(m => m && m.location && m.location.lat != null && m.location.lng != null && !Number.isNaN(Number(m.location.lat)) && !Number.isNaN(Number(m.location.lng)));
    if (!mappable.length) {
      resultsMap.setView([22.425, 87.32], 9);
      if (legend) legend.textContent = 'No listings with valid map coordinates in current results. Listings without coordinates are still shown in the list.';
      setTimeout(() => resultsMap.invalidateSize(), 0);
      return;
    }
    const bounds = [];
    mappable.forEach(m => {
      const lat = Number(m.location.lat), lng = Number(m.location.lng);
      bounds.push([lat, lng]);
      const popup = `<div style="min-width:190px"><strong>${MHUI.escapeHtml(m.name)}</strong><br><span>📍 ${MHUI.escapeHtml([m.address || m.area, m.city].filter(Boolean).join(', '))}</span><br><span>₹${Number(m.price||0)}/month • ${MHUI.escapeHtml(displayAccommodation(m))}</span><br><a href="details.html?id=${encodeURIComponent(m._id)}">View details & map</a></div>`;
      const marker = L.marker([lat, lng]).addTo(markersLayer).bindPopup(popup);
      markerById[String(m._id)] = { marker, lat, lng };
    });
    try { resultsMap.fitBounds(bounds, { padding: [20, 20], maxZoom: 14 }); } catch (_) {}
    if (legend) legend.textContent = `${mappable.length} listing(s) shown on map. Click "📍 Locate on Map" on any card below to highlight its exact pin.`;
    setTimeout(() => resultsMap.invalidateSize(), 0);
  }

  function focusMessOnMap(id) {
    const entry = markerById[String(id)];
    if (!entry || !resultsMap) return;
    document.getElementById('resultsMap')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      resultsMap.setView([entry.lat, entry.lng], 16, { animate: true });
      entry.marker.openPopup();
    }, 250);
  }

  async function loadMesses() {
    const grid = qs('messGrid');
    const noResults = qs('noResults');
    const meta = qs('resultsMeta');
    if (!grid) return;

    grid.innerHTML = '<div class="loading-state">Loading listings...</div>';
    if (noResults) noResults.style.display = 'none';

    try {
      const params = new URLSearchParams();
      const filters = collectFilters();
      Object.entries(filters).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) params.set(k, v); });
      const res = await MHApi.request(`/api/messes?${params.toString()}`);
      const items = res.data || [];
      const p = res.pagination || { total: items.length, page: 1, pages: 1 };
      state.page = p.page || 1;
      state.totalPages = p.pages || 1;

      if (!items.length) {
        grid.innerHTML = '';
        if (noResults) noResults.style.display = 'block';
      } else {
        grid.innerHTML = items.map(m => messCard(m)).join('');
        grid.querySelectorAll('[data-locate-mess]').forEach(btn => {
          btn.addEventListener('click', () => focusMessOnMap(btn.getAttribute('data-locate-mess')));
        });
      }
      if (meta) meta.textContent = `${p.total || 0} listing(s) found • Page ${state.page} of ${state.totalPages}`;
      updateMap(items);
      renderPagination();
    } catch (e) {
      grid.innerHTML = `<div class="error-state">Failed to load listings: ${MHUI.escapeHtml(e.message || 'Unknown error')}</div>`;
      if (meta) meta.textContent = '';
      updateMap([]);
      renderPagination();
    }
  }

  function renderPagination() {
    const el = qs('pagination');
    if (!el) return;
    if (state.totalPages <= 1) { el.innerHTML = ''; return; }
    el.innerHTML = `
      <button class="btn btn-light" ${state.page <= 1 ? 'disabled' : ''} data-page="${state.page - 1}">Prev</button>
      <span class="page-info">Page ${state.page} of ${state.totalPages}</span>
      <button class="btn btn-light" ${state.page >= state.totalPages ? 'disabled' : ''} data-page="${state.page + 1}">Next</button>`;
    el.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = Number(btn.getAttribute('data-page'));
        if (p >= 1 && p <= state.totalPages) { state.page = p; loadMesses(); document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    });
  }

  function clearAllFilters() {
    ['heroSearch','locationFilter','accommodationTypeFilter','minPrice','maxPrice','foodPreferenceFilter','nearbyFilter'].forEach(id => { const el = qs(id); if (el) el.value = ''; });
    document.querySelectorAll('#facilityFilters input[type="checkbox"]').forEach(c => c.checked = false);
    state.page = 1;
    loadMesses();
  }

  function applyFilters() {
    state.page = 1;
    loadMesses();
  }

  document.addEventListener('DOMContentLoaded', () => {
    MHUI.renderNavAuth('navAuthArea');

    setupAutocomplete('heroSearch', 'heroAutocomplete', () => {
      applyFilters();
      document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' });
    });
    setupAutocomplete('locationFilter', 'locationAutocomplete', () => {
      applyFilters();
    });

    // Sync hero search to filter search context when applying
    qs('heroSearchBtn')?.addEventListener('click', () => {
      applyFilters();
      document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' });
    });
    qs('heroSearch')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { applyFilters(); document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' }); }
    });
    qs('locationFilter')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyFilters(); });
    qs('minPrice')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyFilters(); });
    qs('maxPrice')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyFilters(); });
    ['accommodationTypeFilter', 'foodPreferenceFilter', 'nearbyFilter'].forEach(id => {
      qs(id)?.addEventListener('change', applyFilters);
    });
    document.querySelectorAll('#facilityFilters input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', applyFilters);
    });

    qs('applyFiltersBtn')?.addEventListener('click', applyFilters);
    qs('clearFiltersBtn')?.addEventListener('click', clearAllFilters);

    initMap();
    loadMesses();
  });
})();
