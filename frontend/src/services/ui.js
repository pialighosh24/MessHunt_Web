// Shared UI helpers for MessHunt frontend (ported from js/common.js)
// Preserves escaping, toast, date formatting, role guard, and nav auth rendering behavior.

export function $(id) { return document.getElementById(id); }

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
}

export function showToast(message, type = 'info') {
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

export function getDashboardPath(role) {
  if (role === 'admin') return 'admin-dashboard.html';
  if (role === 'owner') return 'owner-dashboard.html';
  return 'student-dashboard.html';
}

export function requireRole(roles) {
  const user = typeof window !== 'undefined' ? window.MHApi?.getUser?.() : null;
  if (!user) {
    if (typeof window !== 'undefined') window.location.href = 'login.html';
    return null;
  }
  if (roles && !roles.includes(user.role)) {
    if (typeof window !== 'undefined') window.location.href = 'index.html';
    return null;
  }
  return user;
}

export function renderNavAuth(containerId = 'navAuthArea') {
  const el = document.getElementById(containerId);
  if (!el) return;
  const user = typeof window !== 'undefined' ? window.MHApi?.getUser?.() : null;
  if (!user) {
    el.innerHTML = `
      <a class="btn btn-light" href="login.html">Login</a>
      <a class="btn btn-primary" href="register.html">Register</a>`;
    return;
  }
  const dash = getDashboardPath(user.role);
  el.innerHTML = `
    <span class="user-badge" style="display:inline-flex;align-items:center;gap:6px;padding:8px 10px;border-radius:999px;background:#e8f0fb;color:#102F53;font-weight:600;font-size:.9rem;">${escapeHtml(user.name || user.email)} (${escapeHtml(user.role)})</span>
    <a class="btn btn-light" href="${dash}">Dashboard</a>
    <button class="btn btn-primary" id="mhLogoutBtn" type="button">Logout</button>`;
  document.getElementById('mhLogoutBtn')?.addEventListener('click', async () => {
    try { await window.MHApi.request('/api/auth/logout', { method: 'POST' }); } catch { /* ignore logout request failure */ }
    window.MHApi.clearAuth();
    window.location.href = 'index.html';
  });
}

export function openLoginModal(
  reason = 'Without login, only the Demo Mode showcase is available. Please login to access real mess listings, search, filters, and details.',
  nextUrl = ''
) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mh-open-login-modal', { detail: { reason, nextUrl } }));
  }
}

export const MHUI = { $, escapeHtml, formatDate, showToast, requireRole, renderNavAuth, getDashboardPath, openLoginModal };

if (typeof window !== 'undefined') {
  window.MHUI = MHUI;
}
