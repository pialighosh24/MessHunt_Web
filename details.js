(function () {
  const params = new URLSearchParams(window.location.search);
  const messId = params.get('id');
  let currentMess = null;
  let myReview = null;
  let selectedRating = 0;

  function setAlert(msg, type = 'error') {
    const el = document.getElementById('pageAlert');
    if (!el) return;
    el.innerHTML = msg ? `<div class="alert ${type}">${MHUI.escapeHtml(msg)}</div>` : '';
  }

  function user() { return MHApi.getUser(); }
  function isStudent() { return user()?.role === 'student'; }

  async function loadMess() {
    if (!messId) {
      document.getElementById('messHeaderPanel').innerHTML = '<div class="error-state">Invalid listing URL (missing id).</div>';
      return;
    }
    try {
      const res = await MHApi.request(`/api/messes/${encodeURIComponent(messId)}`);
      currentMess = res.data;
      renderMess();
      await loadReviews();
    } catch (e) {
      document.getElementById('messHeaderPanel').innerHTML = `<div class="error-state">${MHUI.escapeHtml(e.message || 'Failed to load mess details.')}</div>`;
    }
  }

  function renderMess() {
    const m = currentMess;
    if (!m) return;
    const loc = [m.address, m.area, m.city].filter(Boolean).join(', ') || 'Not specified';
    const ownerName = m.owner?.name || 'Owner';

    document.title = `${m.name} | MessHunt`;
    document.getElementById('messHeaderPanel').innerHTML = `
      <div class="page-header" style="margin-bottom:8px;">
        <div>
          <div class="eyebrow">MESS DETAILS</div>
          <h1 style="margin-bottom:4px;">${MHUI.escapeHtml(m.name)}</h1>
          <p>📍 ${MHUI.escapeHtml(loc)}</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <span class="badge ${m.availabilityStatus === 'available' ? 'success' : 'gray'}">${MHUI.escapeHtml(m.availabilityStatus || 'unknown')}</span>
          <span class="badge warn">⭐ ${Number(m.averageRating || 0).toFixed(1)} (${Number(m.reviewCount || 0)})</span>
          ${isStudent() ? `<button class="btn btn-light" id="favToggleBtn">❤ Favourite</button>` : ''}
          ${isStudent() ? `<button class="btn btn-light" id="reportListingBtn">Report Listing</button>` : ''}
        </div>
      </div>
      <p>${MHUI.escapeHtml(m.description || 'No description provided.')}</p>`;

    // Gallery
    const images = (m.images && m.images.length) ? m.images : ['images/logo.png'];
    const galleryPanel = document.getElementById('galleryPanel');
    galleryPanel.style.display = 'block';
    const main = document.getElementById('mainGalleryImage');
    main.src = images[0];
    const thumbRow = document.getElementById('thumbRow');
    thumbRow.innerHTML = images.map((img, i) => `<img src="${MHUI.escapeHtml(img)}" data-src="${MHUI.escapeHtml(img)}" class="${i===0?'active':''}" onerror="this.src='images/logo.png'">`).join('');
    thumbRow.querySelectorAll('img').forEach(img => img.addEventListener('click', () => {
      main.src = img.getAttribute('data-src');
      thumbRow.querySelectorAll('img').forEach(x => x.classList.remove('active'));
      img.classList.add('active');
    }));

    // Info
    const infoPanel = document.getElementById('infoPanel');
    infoPanel.style.display = 'block';
    const facilities = (m.facilities || []).map(f => `<span class="facility-pill">${MHUI.escapeHtml(f)}</span>`).join('') || '<span class="muted">No facilities listed.</span>';
    const rules = (m.rules || []).map(r => `<li>${MHUI.escapeHtml(r)}</li>`).join('') || '<li class="muted">No rules specified.</li>';
    infoPanel.innerHTML = `
      <div class="panel-header"><h2>Key Information</h2></div>
      <div class="kv-grid" style="margin-bottom:12px;">
        <div class="kv"><small>Monthly Price</small><strong>₹${Number(m.price || 0)}</strong></div>
        <div class="kv"><small>Room Type</small><strong>${MHUI.escapeHtml(m.roomType || 'N/A')}</strong></div>
        <div class="kv"><small>Gender</small><strong>${MHUI.escapeHtml(m.gender || 'Any')}</strong></div>
        <div class="kv"><small>Food</small><strong>${MHUI.escapeHtml(m.foodType || (m.foodAvailable ? 'Available' : 'Not specified'))}</strong></div>
      </div>
      <h3>Facilities</h3>
      <div class="facility-list">${facilities}</div>
      <h3 style="margin-top:14px;">House Rules</h3>
      <ul style="padding-left:18px; margin-top:6px;">${rules}</ul>`;

    // Contact
    const contactPanel = document.getElementById('contactPanel');
    contactPanel.style.display = 'block';
    const phone = m.contactPhone || m.owner?.phone || '';
    const whatsapp = m.whatsapp || phone || '';
    const email = m.contactEmail || m.owner?.email || '';
    const waNum = (whatsapp || '').replace(/[^0-9]/g, '');
    const mapLink = (m.location?.lat && m.location?.lng)
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.location.lat)},${encodeURIComponent(m.location.lng)}`
      : (m.location?.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`);
    contactPanel.innerHTML = `
      <div class="panel-header"><h2>Owner & Contact</h2></div>
      <div class="info-list">
        <div class="info-row"><span>Owner</span><strong>${MHUI.escapeHtml(ownerName)}</strong></div>
        <div class="info-row"><span>Phone</span><strong>${MHUI.escapeHtml(phone || 'Not provided')}</strong></div>
        <div class="info-row"><span>Email</span><strong>${MHUI.escapeHtml(email || 'Not provided')}</strong></div>
        <div class="info-row"><span>WhatsApp</span><strong>${MHUI.escapeHtml(whatsapp || 'Not provided')}</strong></div>
      </div>
      <div class="contact-links">
        ${phone ? `<a class="btn btn-light" href="tel:${MHUI.escapeHtml(phone)}">Call</a>` : ''}
        ${waNum ? `<a class="btn btn-light" target="_blank" rel="noopener" href="https://wa.me/91${MHUI.escapeHtml(waNum)}">WhatsApp</a>` : ''}
        ${email ? `<a class="btn btn-light" href="mailto:${MHUI.escapeHtml(email)}">Email</a>` : ''}
        <a class="btn btn-primary" target="_blank" rel="noopener" href="${mapLink}">Open in Google Maps</a>
      </div>
      <p class="small-note" style="margin-top:10px;">Contact the owner to confirm availability and details before visiting.</p>`;

    // Location/map
    const locationPanel = document.getElementById('locationPanel');
    locationPanel.style.display = 'block';
    const lat = m.location?.lat;
    const lng = m.location?.lng;
    let mapHtml = `<p class="muted">Map coordinates are not available for this listing.</p>`;
    if (lat && lng) {
      const delta = 0.01;
      const bbox = `${lng-delta},${lat-delta},${lng+delta},${lat+delta}`;
      const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
      mapHtml = `
        <iframe class="map-frame" title="Mess Location" src="${src}"></iframe>
        <div class="form-actions" style="margin-top:10px;">
          <button class="btn btn-light" id="useMyLocationBtn" type="button">Use My Location</button>
          <a class="btn btn-primary" target="_blank" rel="noopener" href="${mapLink}">Directions</a>
        </div>
        <p id="myLocationText" class="small-note" style="margin-top:8px;"></p>`;
    } else {
      mapHtml += `<div class="form-actions" style="margin-top:10px;"><a class="btn btn-primary" target="_blank" rel="noopener" href="${mapLink}">Search on Google Maps</a></div>`;
    }
    locationPanel.innerHTML = `<div class="panel-header"><h2>Location</h2></div><p style="margin-bottom:10px;">${MHUI.escapeHtml(loc)}</p>${mapHtml}`;
    document.getElementById('useMyLocationBtn')?.addEventListener('click', () => {
      if (!navigator.geolocation) return MHUI.showToast('Geolocation is not supported by your browser.', 'error');
      navigator.geolocation.getCurrentPosition((pos) => {
        const t = document.getElementById('myLocationText');
        if (t) t.textContent = `Your location: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}. Open directions to compare with the mess location.`;
      }, () => MHUI.showToast('Unable to access your location.', 'error'));
    });

    // Reviews & booking panels visible
    document.getElementById('reviewsPanel').style.display = 'block';
    document.getElementById('bookingPanel').style.display = 'block';
    renderReviewForm();
    renderBookingForm();

    document.getElementById('favToggleBtn')?.addEventListener('click', toggleFavourite);
    document.getElementById('reportListingBtn')?.addEventListener('click', () => reportTarget('mess', m._id));
  }

  async function toggleFavourite() {
    if (!isStudent()) return MHUI.showToast('Please login as a student to use favourites.', 'error');
    try {
      const res = await MHApi.request(`/api/messes/${encodeURIComponent(messId)}/favourite/toggle`, { method: 'POST' });
      MHUI.showToast(res.message || 'Updated favourites.', 'success');
    } catch (e) { MHUI.showToast(e.message || 'Failed to update favourite.', 'error'); }
  }

  async function reportTarget(targetType, targetId) {
    const u = user();
    if (!u) return MHUI.showToast('Please login to submit a report.', 'error');
    const reason = window.prompt('Reason for report (required):');
    if (!reason) return;
    const details = window.prompt('Additional details (optional):') || '';
    try {
      await MHApi.request('/api/reports', { method: 'POST', body: JSON.stringify({ targetType, targetId, reason, details }) });
      MHUI.showToast('Report submitted for admin review.', 'success');
    } catch (e) { MHUI.showToast(e.message || 'Failed to submit report.', 'error'); }
  }

  function renderReviewForm() {
    const wrap = document.getElementById('reviewFormWrap');
    const u = user();
    if (!wrap) return;
    if (!u) {
      wrap.innerHTML = '<div class="alert">Please <a class="inline-link" href="login.html">login</a> to submit or manage your review.</div>';
      return;
    }
    if (u.role === 'admin') {
      wrap.innerHTML = '<div class="muted">Admins can moderate reviews from the admin dashboard.</div>';
      return;
    }
    const isEdit = !!myReview;
    wrap.innerHTML = `
      <div class="form-card" style="padding:14px;">
        <h3>${isEdit ? 'Edit Your Review' : 'Write a Review'}</h3>
        <div class="stars" id="starPicker" style="margin:8px 0;">
          ${[1,2,3,4,5].map(n => `<button type="button" data-star="${n}" class="${n <= (myReview?.rating || selectedRating) ? 'active' : ''}">★</button>`).join('')}
        </div>
        <textarea id="reviewComment" rows="3" placeholder="Share your experience...">${MHUI.escapeHtml(myReview?.comment || '')}</textarea>
        <div class="form-actions">
          <button class="btn btn-primary" id="saveReviewBtn" type="button">${isEdit ? 'Update Review' : 'Submit Review'}</button>
          ${isEdit ? '<button class="btn btn-danger" id="deleteMyReviewBtn" type="button">Delete My Review</button>' : ''}
        </div>
      </div>`;
    selectedRating = myReview?.rating || selectedRating || 0;
    wrap.querySelectorAll('#starPicker button').forEach(btn => btn.addEventListener('click', () => {
      selectedRating = Number(btn.getAttribute('data-star'));
      wrap.querySelectorAll('#starPicker button').forEach(b => b.classList.toggle('active', Number(b.getAttribute('data-star')) <= selectedRating));
    }));
    document.getElementById('saveReviewBtn')?.addEventListener('click', saveReview);
    document.getElementById('deleteMyReviewBtn')?.addEventListener('click', deleteMyReview);
  }

  async function loadReviews() {
    try {
      const res = await MHApi.request(`/api/messes/${encodeURIComponent(messId)}/reviews`);
      const reviews = res.data || [];
      const u = user();
      myReview = u ? reviews.find(r => String(r.user?._id || r.user) === String(u._id)) : null;
      renderReviewForm();
      renderReviews(reviews);
      const avg = currentMess?.averageRating || 0;
      const count = currentMess?.reviewCount || reviews.length;
      document.getElementById('ratingSummary').textContent = `Average: ${Number(avg).toFixed(1)} / 5 • ${count} review(s)`;
    } catch (e) {
      document.getElementById('reviewsList').innerHTML = `<div class="error-state">${MHUI.escapeHtml(e.message || 'Failed to load reviews.')}</div>`;
    }
  }

  function renderReviews(reviews) {
    const list = document.getElementById('reviewsList');
    if (!list) return;
    if (!reviews.length) { list.innerHTML = '<div class="empty-state">No reviews yet. Be the first to share your experience.</div>'; return; }
    const u = user();
    list.innerHTML = reviews.map(r => {
      const rid = r._id;
      const mine = u && String(r.user?._id || r.user) === String(u._id);
      const name = r.user?.name || 'User';
      return `<div class="list-item">
        <div class="review-item-head">
          <div><strong>${MHUI.escapeHtml(name)}</strong><div class="muted">${'★'.repeat(Number(r.rating||0))}${'☆'.repeat(5-Number(r.rating||0))} • ${MHUI.escapeHtml(MHUI.formatDate(r.createdAt))}</div></div>
          ${r.isHidden ? '<span class="badge gray">Hidden</span>' : ''}
        </div>
        <p style="margin-top:6px;color:#334155;">${MHUI.escapeHtml(r.comment || '')}</p>
        <div class="review-actions">
          ${mine ? `<span class="badge success">Your review</span>` : ''}
          ${u && !mine ? `<button class="btn btn-light" data-report-review="${MHUI.escapeHtml(rid)}">Report</button>` : ''}
        </div>
      </div>`;
    }).join('');
    list.querySelectorAll('[data-report-review]').forEach(btn => btn.addEventListener('click', () => reportTarget('review', btn.getAttribute('data-report-review'))));
  }

  async function saveReview() {
    const u = user();
    if (!u) return MHUI.showToast('Please login to submit a review.', 'error');
    const comment = document.getElementById('reviewComment')?.value.trim() || '';
    if (!selectedRating || !comment) return MHUI.showToast('Please select a rating and write a comment.', 'error');
    try {
      if (myReview) {
        await MHApi.request(`/api/reviews/${encodeURIComponent(myReview._id)}`, { method: 'PUT', body: JSON.stringify({ rating: selectedRating, comment }) });
        MHUI.showToast('Review updated.', 'success');
      } else {
        await MHApi.request(`/api/messes/${encodeURIComponent(messId)}/reviews`, { method: 'POST', body: JSON.stringify({ rating: selectedRating, comment }) });
        MHUI.showToast('Review submitted.', 'success');
      }
      await refreshMessAndReviews();
    } catch (e) { MHUI.showToast(e.message || 'Failed to save review.', 'error'); }
  }

  async function deleteMyReview() {
    if (!myReview) return;
    if (!window.confirm('Delete your review?')) return;
    try {
      await MHApi.request(`/api/reviews/${encodeURIComponent(myReview._id)}`, { method: 'DELETE' });
      myReview = null; selectedRating = 0;
      MHUI.showToast('Review deleted.', 'success');
      await refreshMessAndReviews();
    } catch (e) { MHUI.showToast(e.message || 'Failed to delete review.', 'error'); }
  }

  async function refreshMessAndReviews() {
    try {
      const res = await MHApi.request(`/api/messes/${encodeURIComponent(messId)}`);
      currentMess = res.data;
    } catch (_) {}
    await loadReviews();
    // update header rating quickly
    if (currentMess) renderMess();
  }

  function renderBookingForm() {
    const wrap = document.getElementById('bookingWrap');
    const u = user();
    if (!wrap) return;
    if (!u) {
      wrap.innerHTML = '<div class="alert">Please <a class="inline-link" href="login.html">login</a> as a student to send a booking request.</div>';
      return;
    }
    if (u.role !== 'student') {
      wrap.innerHTML = `<div class="muted">Booking requests can be created from student accounts. You are logged in as <strong>${MHUI.escapeHtml(u.role)}</strong>.</div>`;
      return;
    }
    wrap.innerHTML = `
      <form id="bookingForm" class="form-card" style="padding:14px;">
        <p class="small-note">Send a booking/visit request to the owner. No online payment is required.</p>
        <div class="form-grid">
          <div><label for="bName">Your Name</label><input id="bName" value="${MHUI.escapeHtml(u.name || '')}" required></div>
          <div><label for="bPhone">Phone</label><input id="bPhone" value="${MHUI.escapeHtml(u.phone || '')}" required></div>
          <div><label for="bEmail">Email</label><input id="bEmail" type="email" value="${MHUI.escapeHtml(u.email || '')}" required></div>
          <div><label for="bDate">Preferred Visit Date</label><input id="bDate" type="date" required></div>
          <div><label for="bTime">Preferred Time</label>
            <select id="bTime">
              <option>Morning (10:00 AM - 12:00 PM)</option>
              <option>Afternoon (12:00 PM - 3:00 PM)</option>
              <option>Evening (4:00 PM - 7:00 PM)</option>
            </select>
          </div>
        </div>
        <label for="bMsg">Message (optional)</label>
        <textarea id="bMsg" rows="3" placeholder="Any questions or requirements..."></textarea>
        <div class="form-actions"><button class="btn btn-primary" type="submit">Submit Booking Request</button></div>
      </form>`;
    document.getElementById('bookingForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await MHApi.request(`/api/messes/${encodeURIComponent(messId)}/bookings`, {
          method: 'POST',
          body: JSON.stringify({
            studentName: document.getElementById('bName').value.trim(),
            studentPhone: document.getElementById('bPhone').value.trim(),
            studentEmail: document.getElementById('bEmail').value.trim(),
            visitDate: document.getElementById('bDate').value,
            visitTime: document.getElementById('bTime').value,
            message: document.getElementById('bMsg').value.trim(),
          })
        });
        MHUI.showToast('Booking request submitted successfully.', 'success');
        e.target.reset();
      } catch (err) { MHUI.showToast(err.message || 'Failed to submit booking request.', 'error'); }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    MHUI.renderNavAuth('navAuthArea');
    loadMess();
  });
})();
