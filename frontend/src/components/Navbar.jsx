import { useEffect, useState } from 'react'
import { MHApi } from '../services/api'

function getDashboardPath(role) {
  if (role === 'admin') return 'admin-dashboard.html'
  if (role === 'owner') return 'owner-dashboard.html'
  return 'student-dashboard.html'
}

export default function Navbar({
  brandHref = '/index.html',
  navLinks = [
    { href: '#search-section', label: 'Search' },
    { href: '#explore', label: 'Listings' },
    { href: '#how', label: 'How It Works' },
  ],
}) {
  const [user, setUser] = useState(() => {
    try { return MHApi.getUser() } catch { return null }
  })

  useEffect(() => {
    const sync = () => {
      try { setUser(MHApi.getUser()) } catch { setUser(null) }
    }
    window.addEventListener('storage', sync)
    window.addEventListener('mh-auth-change', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('mh-auth-change', sync)
    }
  }, [])

  const onLogout = async () => {
    try { await MHApi.request('/api/auth/logout', { method: 'POST' }) } catch { /* ignore */ }
    try { MHApi.clearAuth() } catch { /* ignore */ }
    setUser(null)
    window.location.href = 'index.html'
  }

  return (
    <header className="navbar">
      <a href={brandHref} className="brand" aria-label="MessHunt Home">
        <img
          src="/assets/logo.svg"
          alt="MessHunt"
          className="brand-logo"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            const fallback = e.currentTarget.nextElementSibling
            if (fallback) fallback.style.display = 'flex'
          }}
        />
        <div className="brand-fallback" style={{ display: 'none' }}>
          <span className="brand-name">Mess<span>Hunt</span></span>
          <span className="brand-tagline">Find Your Perfect Mess</span>
        </div>
      </a>
      <nav className="desktop-nav">
        {navLinks.map((l) => <a key={l.href + l.label} href={l.href}>{l.label}</a>)}
      </nav>
      <div className="nav-actions" id="navAuthArea">
        {!user ? (
          <>
            <a className="btn btn-light" href="login.html">Login</a>
            <a className="btn btn-primary" href="register.html">Register</a>
          </>
        ) : (
          <>
            <span
              className="user-badge"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 10px', borderRadius: '999px', background: '#e8f0fb', color: '#102F53', fontWeight: 600, fontSize: '.9rem' }}
            >
              {`${user.name || user.email} (${user.role})`}
            </span>
            <a className="btn btn-light" href={getDashboardPath(user.role)}>Dashboard</a>
            <button className="btn btn-primary" id="mhLogoutBtn" type="button" onClick={onLogout}>Logout</button>
          </>
        )}
      </div>
    </header>
  )
}
