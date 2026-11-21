// Shared API helper for MessHunt frontend (uses existing backend on same origin or localhost:5000)
(function () {
  const DEFAULT_BASE = (window.location.port === '5000') ? '' : 'http://localhost:5000';
  const API_BASE = window.MESSHUNT_API_BASE || DEFAULT_BASE;

  let tabToken = null;
  let tabUser = null;

  function detectPortalRole() {
    const p = (window.location.pathname || '').toLowerCase();
    if (p.includes('owner-dashboard')) return 'owner';
    if (p.includes('student-dashboard')) return 'student';
    if (p.includes('admin-dashboard')) return 'admin';
    return null;
  }

  function parseJson(raw) {
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  }

  function getUser() {
    const portalRole = detectPortalRole();
    if (portalRole) {
      if (tabUser && tabUser.role === portalRole) return tabUser;
      const ssUser = parseJson(sessionStorage.getItem('mh_tab_user'));
      if (ssUser && ssUser.role === portalRole) {
        tabUser = ssUser;
        return ssUser;
      }
      const roleUser = parseJson(localStorage.getItem('mh_user_' + portalRole));
      if (roleUser && roleUser.role === portalRole) {
        tabUser = roleUser;
        return roleUser;
      }
      const defaultUser = parseJson(localStorage.getItem('mh_user'));
      if (defaultUser && defaultUser.role === portalRole) {
        localStorage.setItem('mh_user_' + portalRole, JSON.stringify(defaultUser));
        const defTok = localStorage.getItem('mh_token');
        if (defTok) localStorage.setItem('mh_token_' + portalRole, defTok);
        tabUser = defaultUser;
        return defaultUser;
      }
      return defaultUser;
    }

    const ssUser = parseJson(sessionStorage.getItem('mh_tab_user'));
    const lsUser = parseJson(localStorage.getItem('mh_user'));
    return lsUser || ssUser || tabUser || null;
  }

  function getToken() {
    const portalRole = detectPortalRole();
    if (portalRole) {
      if (tabToken && tabUser && tabUser.role === portalRole) return tabToken;
      const ssUser = parseJson(sessionStorage.getItem('mh_tab_user'));
      const ssToken = sessionStorage.getItem('mh_tab_token');
      if (ssToken && ssUser && ssUser.role === portalRole) {
        tabToken = ssToken;
        return ssToken;
      }
      const roleToken = localStorage.getItem('mh_token_' + portalRole);
      if (roleToken) {
        tabToken = roleToken;
        return roleToken;
      }
      const defaultUser = parseJson(localStorage.getItem('mh_user'));
      const defaultToken = localStorage.getItem('mh_token');
      if (defaultToken && defaultUser && defaultUser.role === portalRole) {
        localStorage.setItem('mh_token_' + portalRole, defaultToken);
        tabToken = defaultToken;
        return defaultToken;
      }
      return defaultToken;
    }

    return localStorage.getItem('mh_token') || sessionStorage.getItem('mh_tab_token') || tabToken;
  }

  function setAuth(token, user) {
    if (token) {
      tabToken = token;
      localStorage.setItem('mh_token', token);
      sessionStorage.setItem('mh_tab_token', token);
    }
    if (user) {
      tabUser = user;
      const raw = JSON.stringify(user);
      localStorage.setItem('mh_user', raw);
      sessionStorage.setItem('mh_tab_user', raw);
      if (user.role) {
        localStorage.setItem('mh_user_' + user.role, raw);
        if (token) localStorage.setItem('mh_token_' + user.role, token);
      }
    }
  }

  function clearAuth() {
    const portalRole = detectPortalRole();
    const curUser = getUser();
    const roleToClear = portalRole || curUser?.role;

    tabToken = null;
    tabUser = null;
    sessionStorage.removeItem('mh_tab_token');
    sessionStorage.removeItem('mh_tab_user');

    if (roleToClear) {
      localStorage.removeItem('mh_token_' + roleToClear);
      localStorage.removeItem('mh_user_' + roleToClear);
    }

    const lsUser = parseJson(localStorage.getItem('mh_user'));
    if (!roleToClear || !lsUser || lsUser.role === roleToClear) {
      localStorage.removeItem('mh_token');
      localStorage.removeItem('mh_user');
    }

    // Clean up legacy keys from older prototype
    localStorage.removeItem('messHuntUser');
    localStorage.removeItem('messHuntMembership');
    localStorage.removeItem('messHuntMembershipDate');
    localStorage.removeItem('messHuntMembershipExpiry');
  }

  // Initialize tab memory on load if matching portal role
  (function initTabAuth() {
    const u = getUser();
    const t = getToken();
    if (u && t) {
      tabUser = u;
      tabToken = t;
      sessionStorage.setItem('mh_tab_user', JSON.stringify(u));
      sessionStorage.setItem('mh_tab_token', t);
    }
  })();

  async function request(path, options = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
      cache: 'no-store',
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
