import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MHApi } from '../services/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [role, setRole] = useState('student')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [alert, setAlert] = useState({ type: '', message: '' })

  useEffect(() => { document.title = 'Register | MessHunt' }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setAlert({ type: '', message: '' })
    const payload = {
      name: name.trim(),
      role,
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      password,
    }
    if (payload.password !== confirmPassword) {
      setAlert({ type: 'error', message: 'Passwords do not match.' })
      return
    }
    try {
      const res = await MHApi.request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      MHApi.setAuth(res.token, res.user)
      window.dispatchEvent(new Event('mh-auth-change'))
      setAlert({ type: 'success', message: 'Registration successful. Redirecting...' })
      const nextRole = res.user.role
      setTimeout(() => {
        navigate(nextRole === 'admin' ? '/admin-dashboard.html' : nextRole === 'owner' ? '/owner-dashboard.html' : '/student-dashboard.html', { replace: true })
      }, 600)
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Registration failed' })
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card" style={{ maxWidth: '640px' }}>
        <h1>Create Account</h1>
        <p>Register as a student or mess owner. Admin accounts are managed securely by the system administrator.</p>
        <div id="registerAlert">
          {alert.message && <div className={`alert ${alert.type}`}>{alert.message}</div>}
        </div>
        <form id="registerForm" onSubmit={onSubmit}>
          <div className="form-grid">
            <div>
              <label htmlFor="name">Full Name</label>
              <input type="text" id="name" required placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="role">Register As</label>
              <select id="role" required value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="owner">Mess Owner</option>
              </select>
            </div>
            <div>
              <label htmlFor="email">Email</label>
              <input type="email" id="email" required autoComplete="off" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label htmlFor="phone">Phone</label>
              <input type="text" id="phone" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <label htmlFor="address">Address (optional)</label>
          <input type="text" id="address" placeholder="City / area" value={address} onChange={(e) => setAddress(e.target.value)} />
          <div className="form-grid">
            <div>
              <label htmlFor="password">Password</label>
              <input type="password" id="password" required autoComplete="new-password" minLength={6} placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input type="password" id="confirmPassword" required autoComplete="new-password" minLength={6} placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-block">Create Account</button>
          </div>
        </form>
        <p style={{ marginTop: '12px' }}>Already have an account? <a className="inline-link" href="/login.html">Login</a></p>
      </div>
    </main>
  )
}
