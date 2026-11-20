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

  function renderNavAuth(containerId = 'navAuthArea') {
    const el = document.getElementById(containerId);
    if (!el) return;
    const user = window.MHApi?.getUser();
    if (!user) {
      el.innerHTML = `
        <a class="btn btn-light" href="login.html">Login</a>
        <a class="btn btn-primary" href="register.html">Register</a>`;
      return;
    }
    const dash = user.role === 'admin' ? 'admin-dashboard.html' : user.role === 'owner' ? 'owner-dashboard.html' : 'student-dashboard.html';
    el.innerHTML = `
      <span class="user-badge" style="display:inline-flex;align-items:center;gap:6px;padding:8px 10px;border-radius:999px;background:#e8f0fb;color:#102F53;font-weight:600;font-size:.9rem;">${escapeHtml(user.name || user.email)} (${escapeHtml(user.role)})</span>
      <a class="btn btn-light" href="${dash}">Dashboard</a>
      <button class="btn btn-primary" id="mhLogoutBtn" type="button">Logout</button>`;
    document.getElementById('mhLogoutBtn')?.addEventListener('click', async () => {
      try { await window.MHApi.request('/api/auth/logout', { method: 'POST' }); } catch (_) {}
      window.MHApi.clearAuth();
      window.location.href = 'index.html';
    });
  }

  window.MHUI = { $, escapeHtml, formatDate, showToast, requireRole, renderNavAuth };
})();
