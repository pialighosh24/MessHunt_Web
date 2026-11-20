// MessHunt landing/discovery (DB-backed via API, no membership/payment/AI)
(function () {
  const state = {
    page: 1,
    limit: 9,
    totalPages: 1,
  };

  function qs(id) { return document.getElementById(id); }

  function cardImage(mess) {
    const img = (mess.images && mess.images[0]) ? mess.images[0] : 'images/logo.png';
    return img;
  }

  function messCard(mess, compact = false) {
    const facilities = (mess.facilities || []).slice(0, compact ? 3 : 4).map(f => `<span class="tag">${MHUI.escapeHtml(f)}</span>`).join('');
    const locationText = [mess.area, mess.address, mess.city].filter(Boolean).join(', ') || 'Location not specified';
    return `
      <article class="mess-card ${compact ? 'compact-card' : ''}">
        <div class="mess-image">
          <img src="${MHUI.escapeHtml(cardImage(mess))}" alt="${MHUI.escapeHtml(mess.name)}" onerror="this.src='images/logo.png'">
          <div class="rating">⭐ ${Number(mess.averageRating || 0).toFixed(1)}</div>
          <div class="mess-type">${MHUI.escapeHtml(mess.gender || 'Any')}</div>
        </div>
        <div class="mess-content">
          <h3>${MHUI.escapeHtml(mess.name)}</h3>
          <p class="mess-location">📍 ${MHUI.escapeHtml(locationText)}</p>
          <div class="facility-tags">${facilities || '<span class="tag muted">No facilities listed</span>'}</div>
          <div class="mess-details">
            <div class="detail-item"><small>Monthly</small><strong>₹${Number(mess.price || 0)}</strong></div>
            <div class="detail-item"><small>Food</small><strong>${MHUI.escapeHtml(mess.foodType || (mess.foodAvailable ? 'Available' : 'Not specified'))}</strong></div>
            <div class="detail-item"><small>Room</small><strong>${MHUI.escapeHtml(mess.roomType || 'N/A')}</strong></div>
            <div class="detail-item"><small>Status</small><strong>${mess.availabilityStatus === 'available' ? 'Available' : 'Unavailable'}</strong></div>
          </div>
          <div class="card-actions">
            <a class="btn btn-light" href="details.html?id=${encodeURIComponent(mess._id)}">View Details</a>
          </div>
        </div>
      </article>`;
  }

  async function loadFeaturedAndRecent() {
    try {
      const [featured, recent] = await Promise.all([
        MHApi.request('/api/messes/featured'),
        MHApi.request('/api/messes/recent')
      ]);
      const fg = qs('featuredGrid');
      const rg = qs('recentGrid');
      if (fg) fg.innerHTML = (featured.data || []).map(m => messCard(m, true)).join('') || '<div class="empty-state">No featured listings yet.</div>';
      if (rg) rg.innerHTML = (recent.data || []).map(m => messCard(m, true)).join('') || '<div class="empty-state">No recent listings yet.</div>';

      // Populate area filter from available data
      const areas = Array.from(new Set([...(featured.data||[]), ...(recent.data||[])].map(m => (m.area||'').trim()).filter(Boolean))).sort();
      const areaSel = qs('areaFilter');
      if (areaSel && areas.length) {
        const existing = new Set(Array.from(areaSel.options).map(o => o.value));
        areas.forEach(a => { if (!existing.has(a)) { const opt = document.createElement('option'); opt.value = a; opt.textContent = a; areaSel.appendChild(opt); } });
      }
    } catch (e) {
      // silent on landing widgets
      const fg = qs('featuredGrid'); const rg = qs('recentGrid');
      if (fg) fg.innerHTML = '<div class="empty-state">Unable to load featured listings right now.</div>';
      if (rg) rg.innerHTML = '<div class="empty-state">Unable to load recent listings right now.</div>';
    }
  }

  function collectFilters() {
    return {
      search: (qs('searchInput')?.value || '').trim(),
      area: qs('areaFilter')?.value || '',
      gender: qs('genderFilter')?.value || '',
      foodType: qs('foodFilter')?.value || '',
      minPrice: qs('minPrice')?.value || '',
      maxPrice: qs('maxPrice')?.value || '',
      sort: qs('sortFilter')?.value || 'newest',
      page: state.page,
      limit: state.limit,
    };
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
      }
      if (meta) meta.textContent = `${p.total || 0} listing(s) found • Page ${state.page} of ${state.totalPages}`;
      renderPagination();
    } catch (e) {
      grid.innerHTML = `<div class="error-state">Failed to load listings: ${MHUI.escapeHtml(e.message || 'Unknown error')}</div>`;
      if (meta) meta.textContent = '';
      renderPagination();
    }
  }

  function renderPagination() {
    const el = qs('pagination');
    if (!el) return;
    if (state.totalPages <= 1) { el.innerHTML = ''; return; }
    let html = '';
    html += `<button class="btn btn-light" ${state.page <= 1 ? 'disabled' : ''} data-page="${state.page - 1}">Prev</button>`;
    html += `<span class="page-info">Page ${state.page} of ${state.totalPages}</span>`;
    html += `<button class="btn btn-light" ${state.page >= state.totalPages ? 'disabled' : ''} data-page="${state.page + 1}">Next</button>`;
    el.innerHTML = html;
    el.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = Number(btn.getAttribute('data-page'));
        if (p >= 1 && p <= state.totalPages) { state.page = p; loadMesses(); }
      });
    });
  }

  function clearFilters() {
    ['searchInput','areaFilter','genderFilter','foodFilter','minPrice','maxPrice'].forEach(id => { const el = qs(id); if (el) el.value = ''; });
    const sort = qs('sortFilter'); if (sort) sort.value = 'newest';
    state.page = 1;
    loadMesses();
  }

  document.addEventListener('DOMContentLoaded', () => {
    MHUI.renderNavAuth('navAuthArea');
    loadFeaturedAndRecent();
    loadMesses();

    qs('applyFiltersBtn')?.addEventListener('click', () => { state.page = 1; loadMesses(); });
    qs('clearFiltersBtn')?.addEventListener('click', clearFilters);
    qs('searchInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { state.page = 1; loadMesses(); } });

    qs('heroSearchBtn')?.addEventListener('click', () => {
      const v = qs('heroSearch')?.value || '';
      const si = qs('searchInput'); if (si) si.value = v;
      state.page = 1;
      loadMesses();
      document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' });
    });

    document.querySelectorAll('#quickTags button[data-query]').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.getAttribute('data-query') || '';
        const si = qs('searchInput'); if (si) si.value = q;
        state.page = 1;
        loadMesses();
        document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  });
})();
