// Shared API helper for MessHunt frontend (uses existing backend on same origin or localhost:5000)
(function () {
  const DEFAULT_BASE = (window.location.port === '5000') ? '' : 'http://localhost:5000';
  const API_BASE = window.MESSHUNT_API_BASE || DEFAULT_BASE;

  function getToken() {
    return localStorage.getItem('mh_token');
  }

  function setAuth(token, user) {
    if (token) localStorage.setItem('mh_token', token);
    if (user) localStorage.setItem('mh_user', JSON.stringify(user));
  }

  function clearAuth() {
    localStorage.removeItem('mh_token');
    localStorage.removeItem('mh_user');
    // Clean up legacy keys from older prototype
    localStorage.removeItem('messHuntUser');
    localStorage.removeItem('messHuntMembership');
    localStorage.removeItem('messHuntMembershipDate');
    localStorage.removeItem('messHuntMembershipExpiry');
  }

  function getUser() {
    try {
      const raw = localStorage.getItem('mh_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function request(path, options = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    let data = null;
    const text = await res.text();
    try { data = text ? JSON.parse(text) : null; } catch { data = { success: false, message: text || 'Unexpected server response.' }; }

    if (!res.ok) {
      const msg = (data && data.message) ? data.message : `Request failed (${res.status})`;
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  window.MHApi = { API_BASE, request, getToken, setAuth, clearAuth, getUser };
})();
