import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MHApi } from '../services/api'
import { showToast } from '../services/ui'

export default function LoginModal() {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('Without login, only the Demo Mode showcase is available. Please login to view all 20 verified mess listings, search, filters, and details.')
  const [nextUrl, setNextUrl] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    const onOpen = (e) => {
      const d = e?.detail || {}
      if (d.reason) setReason(d.reason)
      else setReason('Without login, only the Demo Mode showcase is available. Please login to view all 20 verified mess listings, search, filters, and details.')
      setNextUrl(d.nextUrl || '')
      setError('')
      setEmail('')
      setPassword('')
      setArmed(false)
      setOpen(true)
    }
    window.addEventListener('mh-open-login-modal', onOpen)
    return () => window.removeEventListener('mh-open-login-modal', onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await MHApi.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password })
      })
      MHApi.setAuth(res.token, res.user)
      window.dispatchEvent(new Event('mh-auth-change'))
      setOpen(false)
      setEmail('')
      setPassword('')
      showToast(`Welcome, ${res.user?.name || res.user?.email}! Full website unlocked.`, 'success')

      if (nextUrl) {
        if (nextUrl.startsWith('#')) {
          setTimeout(() => {
            document.querySelector(nextUrl)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
        } else if (nextUrl.startsWith('/')) {
          const [pathPart, hashPart] = nextUrl.split('#')
          navigate(pathPart || '/')
          if (hashPart) {
            setTimeout(() => {
              document.getElementById(hashPart)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 150)
          }
        } else {
          window.location.href = nextUrl
        }
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setSubmitting(false)
    }
  }

  const isOnDemo = location.pathname.toLowerCase().includes('demo')

  return (
    <div
      className="mh-modal-backdrop"
      id="mhLoginPopupBackdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mhLoginPopupTitle"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
    >
      <div className="mh-modal-card">
        <button
          type="button"
          className="mh-modal-close"
          id="mhLoginPopupClose"
          aria-label="Close login popup"
          onClick={() => setOpen(false)}
        >
          ×
        </button>

        <span className="demo-pill-badge" style={{ marginBottom: '10px' }}>🔒 LOGIN REQUIRED</span>
        <h2 id="mhLoginPopupTitle" style={{ marginBottom: '6px', fontSize: '1.5rem' }}>Login to Continue</h2>
        <p style={{ fontSize: '0.92rem', marginBottom: '14px', color: '#475569' }}>{reason}</p>

        {error ? <div className="alert error" id="popupLoginAlert">{error}</div> : null}

        <form id="mhPopupLoginForm" onSubmit={onSubmit} autoComplete="off">
          <label htmlFor="popupLoginEmail">Email</label>
          <input
            type="email"
            id="popupLoginEmail"
            name="mh_popup_email_field"
            required
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            readOnly={!armed}
            onFocus={() => setArmed(true)}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="popupLoginPassword">Password</label>
          <input
            type="password"
            id="popupLoginPassword"
            name="mh_popup_pass_field"
            required
            autoComplete="new-password"
            readOnly={!armed}
            onFocus={() => setArmed(true)}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="form-actions" style={{ marginTop: '16px' }}>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Logging in...' : '🔑 Login & Unlock Website'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isOnDemo ? (
            <button type="button" className="btn btn-light btn-block" onClick={() => setOpen(false)}>
              ✨ Continue Viewing Demo Mode (No Login)
            </button>
          ) : (
            <a
              className="btn btn-light btn-block"
              href="/demo.html"
              onClick={() => setOpen(false)}
            >
              ✨ Explore Demo Mode (No Login Required)
            </a>
          )}
          <p style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '4px' }}>
            Don&apos;t have an account?{' '}
            <a className="inline-link" href="/register.html" onClick={() => setOpen(false)}>
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

