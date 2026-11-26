import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MHApi } from '../services/api'

function getDashboardPath(role) {
  if (role === 'admin') return '/admin-dashboard.html'
  if (role === 'owner') return '/owner-dashboard.html'
  return '/student-dashboard.html'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [armed, setArmed] = useState(false)
  const [alert, setAlert] = useState({ type: '', message: '' })

  useEffect(() => {
    document.title = 'Login | MessHunt'
    try {
      const existing = MHApi.getUser()
      if (existing) {
        navigate(getDashboardPath(existing.role), { replace: true })
      }
    } catch { /* ignore */ }
  }, [navigate])

  const onSubmit = async (e) => {
    e.preventDefault()
    setAlert({ type: '', message: '' })
    try {
      const res = await MHApi.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password })
      })
      MHApi.setAuth(res.token, res.user)
      window.dispatchEvent(new Event('mh-auth-change'))
      const params = new URLSearchParams(location.search)
      const next = params.get('next')
      const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null
      navigate(safeNext || getDashboardPath(res.user.role), { replace: true })
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Login failed' })
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Login</h1>
        <p>Access your student, owner, or admin account.</p>
        <div id="loginAlert">
          {alert.message && <div className={`alert ${alert.type}`}>{alert.message}</div>}
        </div>
        <form id="loginForm" onSubmit={onSubmit} autoComplete="off">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="mh_login_email_field" required autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} readOnly={!armed} onFocus={() => setArmed(true)} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />

          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="mh_login_pass_field" required autoComplete="new-password" readOnly={!armed} onFocus={() => setArmed(true)} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-block">Login</button>
          </div>
        </form>
        <p style={{ marginTop: '12px' }}>Don&apos;t have an account? <a className="inline-link" href="/register.html">Register</a></p>
      </div>
    </main>
  )
}
