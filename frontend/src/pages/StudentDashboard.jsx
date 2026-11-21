import { useEffect, useState } from 'react'
import { MHApi } from '../services/api'
import { formatDate, showToast } from '../services/ui'

function badgeClass(status) {
  const map = { pending: 'warn', accepted: 'success', rejected: 'danger', cancelled: 'gray' }
  return `badge ${map[status] || 'gray'}`
}

export default function StudentDashboard() {
  const [user, setUser] = useState(() => { try { return MHApi.getUser() } catch { return null } })
  const [alert, setAlert] = useState({ msg: '', type: 'error' })
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', address: '', bio: '' })
  const [favs, setFavs] = useState([])
  const [bookings, setBookings] = useState([])
  const [loadingFavs, setLoadingFavs] = useState(true)
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [favErr, setFavErr] = useState('')
  const [bookErr, setBookErr] = useState('')

  const setDashAlert = (msg = '', type = 'error') => setAlert({ msg, type })

  const loadProfile = async () => {
    const res = await MHApi.request('/api/users/profile')
    const u = res.user
    setUser(u)
    try { MHApi.setAuth(MHApi.getToken(), u) } catch {}
    window.dispatchEvent(new Event('mh-auth-change'))
    setProfile({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      address: u.address || '',
      bio: u.bio || '',
    })
  }

  const loadFavourites = async () => {
    setLoadingFavs(true); setFavErr('')
    try {
      const res = await MHApi.request('/api/favourites/mine')
      setFavs(res.data || [])
    } catch (e) { setFavErr(e.message || 'Failed to load favourites') }
    finally { setLoadingFavs(false) }
  }

  const loadBookings = async () => {
    setLoadingBookings(true); setBookErr('')
    try {
      const res = await MHApi.request('/api/bookings/mine')
      setBookings(res.data || [])
    } catch (e) { setBookErr(e.message || 'Failed to load bookings') }
    finally { setLoadingBookings(false) }
  }

  useEffect(() => {
    document.title = 'Student Dashboard | MessHunt'
    ;(async () => {
      try {
        await loadProfile()
        await Promise.all([loadFavourites(), loadBookings()])
      } catch (e) {
        setDashAlert(e.message || 'Failed to load dashboard. Please ensure you are logged in and the server is running.')
      }
    })()
  }, [])

  const onProfileSave = async (e) => {
    e.preventDefault(); setDashAlert('')
    try {
      const res = await MHApi.request('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profile.name.trim(),
          phone: profile.phone.trim(),
          address: profile.address.trim(),
          bio: profile.bio.trim(),
        })
      })
      MHApi.setAuth(MHApi.getToken(), res.user)
      window.dispatchEvent(new Event('mh-auth-change'))
      setUser(res.user)
      setDashAlert('Profile updated successfully.', 'success')
    } catch (e) { setDashAlert(e.message || 'Failed to update profile') }
  }

  const onPasswordChange = async (e) => {
    e.preventDefault(); setDashAlert('')
    const form = e.target
    const currentPassword = form.curPass.value
    const newPassword = form.newPass.value
    const newPassword2 = form.newPass2.value
    if (newPassword !== newPassword2) return setDashAlert('New passwords do not match.')
    try {
      await MHApi.request('/api/users/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) })
      form.reset()
      setDashAlert('Password updated successfully.', 'success')
    } catch (e) { setDashAlert(e.message || 'Failed to update password') }
  }

  const removeFav = async (messId) => {
    try {
      await MHApi.request(`/api/messes/${encodeURIComponent(messId)}/favourite`, { method: 'DELETE' })
      showToast('Removed from favourites', 'success')
      loadFavourites()
    } catch (e) { showToast(e.message || 'Failed', 'error') }
  }

  const cancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this booking request?')) return
    try {
      await MHApi.request(`/api/bookings/${encodeURIComponent(bookingId)}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }) })
      showToast('Booking cancelled', 'success')
      loadBookings()
    } catch (e) { showToast(e.message || 'Failed', 'error') }
  }

  const refreshFavs = async (e) => {
    const btn = e.currentTarget
    btn.disabled = true; btn.textContent = 'Refreshing...'
    await loadFavourites()
    btn.disabled = false; btn.textContent = 'Refresh'
    showToast('Favourites refreshed', 'success')
  }

  const refreshBookings = async (e) => {
    const btn = e.currentTarget
    btn.disabled = true; btn.textContent = 'Refreshing...'
    await loadBookings()
    btn.disabled = false; btn.textContent = 'Refresh'
    showToast('Bookings refreshed', 'success')
  }

  return (
    <main className="page-wrap">
      <div className="page-header">
        <div>
          <div className="eyebrow">STUDENT PORTAL</div>
          <h1>My Dashboard</h1>
          <p>Manage your profile, favourites and booking requests.</p>
        </div>
      </div>

      <div id="dashAlert">{alert.msg ? <div className={`alert ${alert.type}`}>{alert.msg}</div> : null}</div>

      <section className="grid-2">
        <div className="panel">
          <div className="panel-header"><h2>Profile</h2></div>
          <form id="profileForm" onSubmit={onProfileSave}>
            <div className="form-grid">
              <div><label>Name</label><input id="pName" required value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} /></div>
              <div><label>Email</label><input id="pEmail" disabled value={profile.email} /></div>
              <div><label>Phone</label><input id="pPhone" value={profile.phone} onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><label>Address</label><input id="pAddress" value={profile.address} onChange={(e) => setProfile(p => ({ ...p, address: e.target.value }))} /></div>
            </div>
            <label>Bio</label>
            <textarea id="pBio" rows="3" value={profile.bio} onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}></textarea>
            <div className="form-actions"><button className="btn btn-primary" type="submit">Save Profile</button></div>
          </form>
        </div>
        <div className="panel">
          <div className="panel-header"><h2>Change Password</h2></div>
          <form id="passwordForm" onSubmit={onPasswordChange}>
            <label>Current Password</label><input id="curPass" name="curPass" type="password" required />
            <label>New Password</label><input id="newPass" name="newPass" type="password" minLength={6} required />
            <label>Confirm New Password</label><input id="newPass2" name="newPass2" type="password" minLength={6} required />
            <div className="form-actions"><button className="btn btn-primary" type="submit">Update Password</button></div>
          </form>
          <hr style={{ border: 'none', borderTop: '1px solid #edf2ee', margin: '16px 0' }} />
          <div className="muted" id="accountMeta">
            {user && <><strong>Role:</strong> {user.role}<br /><strong>Joined:</strong> {formatDate(user.createdAt)}</>}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header"><h2>My Favourites</h2><button className="btn btn-light" id="refreshFavs" onClick={refreshFavs}>Refresh</button></div>
        <div id="favouritesList" className="list">
          {loadingFavs ? <div className="loading-state">Loading favourites...</div>
            : favErr ? <div className="error-state">{favErr}</div>
            : favs.length === 0 ? <div className="empty-state">No favourites yet. <a className="inline-link" href="/index.html#explore">Explore listings</a>.</div>
            : favs.map(f => {
                const m = f.mess; if (!m) return null
                return (
                  <div className="list-item" key={f._id || m._id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ marginBottom: '4px' }}>{m.name}</h3>
                      <div className="muted">📍 {[m.area, m.address, m.city].filter(Boolean).join(', ') || 'N/A'} • ₹{Number(m.price || 0)} • ⭐ {Number(m.averageRating || 0).toFixed(1)}</div>
                    </div>
                    <div className="form-actions" style={{ margin: 0 }}>
                      <a className="btn btn-light" href={`/details.html?id=${encodeURIComponent(m._id)}`}>View</a>
                      <button className="btn btn-danger" onClick={() => removeFav(m._id)}>Remove</button>
                    </div>
                  </div>
                )
              })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header"><h2>My Booking Requests</h2><button className="btn btn-light" id="refreshBookings" onClick={refreshBookings}>Refresh</button></div>
        <div id="bookingsList" className="list">
          {loadingBookings ? <div className="loading-state">Loading bookings...</div>
            : bookErr ? <div className="error-state">{bookErr}</div>
            : bookings.length === 0 ? <div className="empty-state">No booking requests yet.</div>
            : bookings.map(b => (
              <div className="list-item" key={b._id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>{b.mess?.name || 'Mess'}</h3>
                  <span className={badgeClass(b.status)}>{b.status || 'unknown'}</span>
                </div>
                <div className="muted" style={{ marginTop: '4px' }}>📍 {[b.mess?.area, b.mess?.address].filter(Boolean).join(', ') || 'N/A'}</div>
                <div style={{ marginTop: '8px', display: 'grid', gap: '4px', fontSize: '.95rem' }}>
                  <div><strong>Visit:</strong> {b.visitDate || ''} {b.visitTime ? `• ${b.visitTime}` : ''}</div>
                  <div><strong>Message:</strong> {b.message || '-'}</div>
                  {b.ownerNote ? <div><strong>Owner note:</strong> {b.ownerNote}</div> : null}
                </div>
                <div className="form-actions">
                  {b.mess?._id ? <a className="btn btn-light" href={`/details.html?id=${encodeURIComponent(b.mess._id)}`}>View Mess</a> : null}
                  {(b.status === 'pending' || b.status === 'accepted') ? <button className="btn btn-danger" onClick={() => cancelBooking(b._id)}>Cancel Request</button> : null}
                </div>
              </div>
            ))}
        </div>
      </section>
    </main>
  )
}
