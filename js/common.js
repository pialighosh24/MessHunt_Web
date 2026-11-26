(function () {
  function $(id) { return document.getElementById(id); }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString();
  }

  function showToast(message, type = 'info') {
    let el = document.getElementById('mh-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'mh-toast';
      el.style.position = 'fixed';
      el.style.right = '16px';
      el.style.bottom = '16px';
      el.style.zIndex = '9999';
      el.style.maxWidth = '360px';
      document.body.appendChild(el);
    }
    const item = document.createElement('div');
    item.textContent = message;
    item.style.marginTop = '8px';
    item.style.padding = '12px 14px';
    item.style.borderRadius = '10px';
    item.style.color = '#fff';
    item.style.boxShadow = '0 8px 24px rgba(0,0,0,.15)';
    item.style.background = type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#334155';
    el.appendChild(item);
    setTimeout(() => item.remove(), 3500);
  }

  function requireRole(roles) {
    const user = window.MHApi?.getUser();
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    if (roles && !roles.includes(user.role)) {
      window.location.href = 'index.html';
      return null;
    }
    return user;
  }

  let activeNextUrl = '';

  function showLoginModal(
    reason = 'Without login, only the Demo Mode showcase is available. Please login to view all 20 verified mess listings, search, filters, and details.',
    nextUrl = ''
  ) {
    activeNextUrl = nextUrl || '';
    let backdrop = document.getElementById('mhLoginPopupBackdrop');
    const isOnDemo = (window.location.pathname || '').toLowerCase().includes('demo');

    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'mhLoginPopupBackdrop';
      backdrop.className = 'mh-modal-backdrop';
      backdrop.setAttribute('role', 'dialog');
      backdrop.setAttribute('aria-modal', 'true');
      backdrop.innerHTML = `
        <div class="mh-modal-card">
          <button type="button" class="mh-modal-close" id="mhLoginPopupClose" aria-label="Close login popup">×</button>
          <span class="demo-pill-badge" style="margin-bottom:10px;">🔒 LOGIN REQUIRED</span>
          <h2 id="mhLoginPopupTitle" style="margin-bottom:6px;font-size:1.5rem;">Login to Continue</h2>
          <p id="mhLoginPopupReason" style="font-size:0.92rem;margin-bottom:14px;color:#475569;"></p>
          <div id="popupLoginAlert"></div>
          <form id="mhPopupLoginForm" autocomplete="off">
            <label for="popupLoginEmail">Email</label>
            <input type="email" id="popupLoginEmail" name="mh_popup_email_field" required autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" readonly placeholder="you@example.com" />
            <label for="popupLoginPassword">Password</label>
            <input type="password" id="popupLoginPassword" name="mh_popup_pass_field" required autocomplete="new-password" readonly placeholder="Enter your password" />
            <div class="form-actions" style="margin-top:16px;">
              <button type="submit" class="btn btn-primary btn-block" id="mhPopupLoginSubmit">🔑 Login &amp; Unlock Website</button>
            </div>
          </form>
          <div style="margin-top:14px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;flex-direction:column;gap:8px;">
            ${isOnDemo
              ? '<button type="button" class="btn btn-light btn-block" id="mhPopupStayDemoBtn">✨ Continue Viewing Demo Mode (No Login)</button>'
              : '<a class="btn btn-light btn-block" href="demo.html">✨ Explore Demo Mode (No Login Required)</a>'}
            <p style="text-align:center;font-size:0.9rem;margin-top:4px;">
              Don't have an account? <a class="inline-link" href="register.html">Register here</a>
            </p>
          </div>
        </div>`;
      document.body.appendChild(backdrop);

      const closePopup = () => { backdrop.style.display = 'none'; };
      backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closePopup(); });
      document.getElementById('mhLoginPopupClose')?.addEventListener('click', closePopup);
      document.getElementById('mhPopupStayDemoBtn')?.addEventListener('click', closePopup);
      ['popupLoginEmail', 'popupLoginPassword'].forEach((id) => {
        document.getElementById(id)?.addEventListener('focus', (ev) => ev.target.removeAttribute('readonly'));
      });

      document.getElementById('mhPopupLoginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const alertEl = document.getElementById('popupLoginAlert');
        const btn = document.getElementById('mhPopupLoginSubmit');
        const email = document.getElementById('popupLoginEmail').value.trim();
        const password = document.getElementById('popupLoginPassword').value;
        if (alertEl) alertEl.innerHTML = '';
        if (btn) { btn.disabled = true; btn.textContent = 'Logging in...'; }
        try {
          const res = await window.MHApi.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
          });
          window.MHApi.setAuth(res.token, res.user);
          renderNavAuth('navAuthArea');
          window.dispatchEvent(new Event('mh-auth-change'));
          closePopup();
          document.getElementById('popupLoginPassword').value = '';
          showToast(`Welcome, ${res.user?.name || res.user?.email}! Full website unlocked.`, 'success');
          if (activeNextUrl) {
            if (activeNextUrl.startsWith('#')) {
              document.querySelector(activeNextUrl)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              window.location.href = activeNextUrl;
            }
          }
        } catch (err) {
          if (alertEl) alertEl.innerHTML = `<div class="alert error">${escapeHtml(err.message || 'Invalid email or password')}</div>`;
        } finally {
          if (btn) { btn.disabled = false; btn.textContent = '🔑 Login & Unlock Website'; }
        }
      });
    }

    const reasonEl = document.getElementById('mhLoginPopupReason');
    if (reasonEl) reasonEl.textContent = reason;
    const alertEl = document.getElementById('popupLoginAlert');
    if (alertEl) alertEl.innerHTML = '';
    const emailEl = document.getElementById('popupLoginEmail');
    const passEl = document.getElementById('popupLoginPassword');
    [emailEl, passEl].forEach((el) => { if (el) { el.value = ''; el.setAttribute('readonly', 'readonly'); } });
    backdrop.style.display = 'flex';
    setTimeout(() => { emailEl?.blur(); }, 50);
  }

  function renderNavAuth(containerId = 'navAuthArea') {
    const el = document.getElementById(containerId);
    if (!el) return;
    const user = window.MHApi?.getUser();
    if (!user) {
      el.innerHTML = `
        <a class="btn btn-demo-nav" id="exploreDemoNavBtn" href="demo.html">✨ Explore Demo</a>
        <a class="btn btn-light" href="login.html">Login</a>
        <a class="btn btn-primary" href="register.html">Register</a>`;
      return;
    }
    const dash = user.role === 'admin' ? 'admin-dashboard.html' : user.role === 'owner' ? 'owner-dashboard.html' : 'student-dashboard.html';
    el.innerHTML = `
      <a class="btn btn-demo-nav" id="exploreDemoNavBtn" href="demo.html">✨ Explore Demo</a>
      <span class="user-badge" style="display:inline-flex;align-items:center;gap:6px;padding:8px 10px;border-radius:999px;background:#e8f0fb;color:#102F53;font-weight:600;font-size:.9rem;">${escapeHtml(user.name || user.email)} (${escapeHtml(user.role)})</span>
      <a class="btn btn-light" href="${dash}">Dashboard</a>
      <button class="btn btn-primary" id="mhLogoutBtn" type="button">Logout</button>`;
    document.getElementById('mhLogoutBtn')?.addEventListener('click', async () => {
      try { await window.MHApi.request('/api/auth/logout', { method: 'POST' }); } catch (_) {}
      window.MHApi.clearAuth();
      window.location.href = 'index.html';
    });
  }

  window.MHUI = { $, escapeHtml, formatDate, showToast, requireRole, renderNavAuth, showLoginModal, openLoginModal: showLoginModal };
})();
