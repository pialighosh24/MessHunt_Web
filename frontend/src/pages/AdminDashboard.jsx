import { useEffect, useState } from 'react'
import { MHApi } from '../services/api'
import { showToast } from '../services/ui'

function badge(status) {
  const s = String(status || '').toLowerCase()
  const map = { approved: 'success', active: 'success', resolved: 'success', pending: 'warn', reviewed: 'warn', open: 'warn', rejected: 'danger', suspended: 'danger', inactive: 'danger', dismissed: 'gray', cancelled: 'gray' }
  return <span className={`badge ${map[s] || 'gray'}`}>{status || 'unknown'}</span>
}

export default function AdminDashboard() {
  const [alert, setAlert] = useState('')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [listings, setListings] = useState([])
  const [reports, setReports] = useState([])
  const [reviews, setReviews] = useState([])
  const [userRoleFilter, setUserRoleFilter] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [listingStatusFilter, setListingStatusFilter] = useState('')
  const [listingSearch, setListingSearch] = useState('')
  const [reportStatusFilter, setReportStatusFilter] = useState('')
  const [loading, setLoading] = useState({ users: false, listings: false, reports: false, reviews: false })

  const loadStats = async () => { const res = await MHApi.request('/api/admin/stats'); setStats(res.data) }
  const loadUsers = async () => {
    setLoading(l => ({ ...l, users: true }))
    try {
      const qs = new URLSearchParams(); if (userRoleFilter) qs.set('role', userRoleFilter); if (userSearch.trim()) qs.set('search', userSearch.trim())
      const res = await MHApi.request(`/api/admin/users?${qs.toString()}`); setUsers(res.data || [])
    } finally { setLoading(l => ({ ...l, users: false })) }
  }
  const loadListings = async () => {
    setLoading(l => ({ ...l, listings: true }))
    try {
      const qs = new URLSearchParams(); if (listingStatusFilter) qs.set('status', listingStatusFilter); if (listingSearch.trim()) qs.set('search', listingSearch.trim())
      const res = await MHApi.request(`/api/admin/messes?${qs.toString()}`); setListings(res.data || [])
    } finally { setLoading(l => ({ ...l, listings: false })) }
  }
  const loadReports = async () => {
    setLoading(l => ({ ...l, reports: true }))
    try {
      const qs = new URLSearchParams(); if (reportStatusFilter) qs.set('status', reportStatusFilter)
      const res = await MHApi.request(`/api/admin/reports?${qs.toString()}`); setReports(res.data || [])
    } finally { setLoading(l => ({ ...l, reports: false })) }
  }
  const loadReviews = async () => {
    setLoading(l => ({ ...l, reviews: true }))
    try { const res = await MHApi.request('/api/admin/reviews'); setReviews(res.data || []) }
    finally { setLoading(l => ({ ...l, reviews: false })) }
  }

  useEffect(() => {
    document.title = 'Admin Dashboard | MessHunt'
    let active = true
    MHApi.request('/api/admin/stats')
      .then(res => { if (active) setStats(res.data) })
      .catch(e => { if (active) setAlert(e.message || 'Failed to load admin dashboard.') })
    return () => { active = false }
  }, [])

  const toggleUser = async (u) => {
    try { await MHApi.request(`/api/admin/users/${encodeURIComponent(u._id)}`, { method: 'PATCH', body: JSON.stringify({ isActive: u.isActive === false }) }); await loadUsers(); showToast('User updated', 'success') }
    catch (e) { showToast(e.message || 'Failed', 'error') }
  }
  const verifyOwner = async (u) => {
    try { await MHApi.request(`/api/admin/users/${encodeURIComponent(u._id)}`, { method: 'PATCH', body: JSON.stringify({ ownerVerified: !u.ownerVerified }) }); await loadUsers(); showToast('Owner verification updated', 'success') }
    catch (e) { showToast(e.message || 'Failed', 'error') }
  }
  const setApproval = async (id, status) => {
    let reason = ''; if (status === 'rejected' || status === 'suspended') reason = window.prompt('Reason (optional but recommended):', '') || ''
    try { await MHApi.request(`/api/admin/messes/${encodeURIComponent(id)}/approval`, { method: 'PATCH', body: JSON.stringify({ approvalStatus: status, rejectionReason: reason }) }); showToast('Listing updated', 'success'); await Promise.all([loadStats(), loadListings()]) }
    catch (e) { showToast(e.message || 'Failed', 'error') }
  }
  const updateReport = async (id, status) => {
    const note = window.prompt('Admin note (optional):', '') || ''
    try { await MHApi.request(`/api/admin/reports/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status, adminNote: note }) }); showToast('Report updated', 'success'); await Promise.all([loadStats(), loadReports()]) }
    catch (e) { showToast(e.message || 'Failed', 'error') }
  }
  const hideReportedReview = async (id) => {
    try { await MHApi.request(`/api/admin/reports/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status: 'resolved', hideReview: true, adminNote: 'Review hidden by admin' }) }); showToast('Reported review hidden', 'success'); await Promise.all([loadStats(), loadReports(), loadReviews()]) }
    catch (e) { showToast(e.message || 'Failed', 'error') }
  }
  const deleteReportedReview = async (id) => {
    if (!window.confirm('Delete the reported review?')) return
    try { await MHApi.request(`/api/admin/reports/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status: 'resolved', deleteReview: true, adminNote: 'Review deleted by admin' }) }); showToast('Reported review deleted', 'success'); await Promise.all([loadStats(), loadReports(), loadReviews()]) }
    catch (e) { showToast(e.message || 'Failed', 'error') }
  }
  const moderateReview = async (r) => {
    try { await MHApi.request(`/api/admin/reviews/${encodeURIComponent(r._id)}/moderate`, { method: 'PATCH', body: JSON.stringify({ isHidden: !r.isHidden }) }); showToast('Review updated', 'success'); await Promise.all([loadStats(), loadReviews()]) }
    catch (e) { showToast(e.message || 'Failed', 'error') }
  }
  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return
    try { await MHApi.request(`/api/reviews/${encodeURIComponent(id)}`, { method: 'DELETE' }); showToast('Review deleted', 'success'); await Promise.all([loadStats(), loadReviews()]) }
    catch (e) { showToast(e.message || 'Failed', 'error') }
  }
  const refreshAll = async () => {
    try { await Promise.all([loadStats(), loadUsers(), loadListings(), loadReports(), loadReviews()]); showToast('Refreshed', 'success') }
    catch (e) { showToast(e.message || 'Refresh failed', 'error') }
  }

  return (
    <main className="page-wrap">
      <div className="page-header">
        <div><div className="eyebrow">ADMIN PORTAL</div><h1>Admin Dashboard</h1><p>Monitor platform activity and manage users, listings, reports and reviews.</p></div>
        <button className="btn btn-light" id="refreshAll" onClick={refreshAll}>Refresh All</button>
      </div>
      <div id="adminAlert">{alert ? <div className="alert error">{alert}</div> : null}</div>
      <section className="grid-4" id="adminStats">
        <div className="stat-card"><div className="label">Students</div><div className="value" id="aStudents">{stats ? (stats.totalStudents ?? 0) : '-'}</div></div>
        <div className="stat-card"><div className="label">Owners</div><div className="value" id="aOwners">{stats ? (stats.totalOwners ?? 0) : '-'}</div></div>
        <div className="stat-card"><div className="label">Listings (Pending/Approved)</div><div className="value" id="aListings">{stats ? `${stats.pendingMesses ?? 0}/${stats.approvedMesses ?? 0}` : '-'}</div></div>
        <div className="stat-card"><div className="label">Open Reports</div><div className="value" id="aReports">{stats ? (stats.openReports ?? 0) : '-'}</div></div>
      </section>

      <section className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-header"><h2>Users</h2>
          <div className="form-actions" style={{ margin: 0 }}>
            <select id="userRoleFilter" value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)}><option value="">All Roles</option><option value="student">Student</option><option value="owner">Owner</option><option value="admin">Admin</option></select>
            <input id="userSearch" placeholder="Search name/email" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
            <button className="btn btn-light" id="loadUsersBtn" onClick={() => loadUsers().catch(e => showToast(e.message, 'error'))}>Load</button>
          </div>
        </div>
        <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Status</th><th>Owner Verified</th><th>Actions</th></tr></thead>
          <tbody id="usersTbody">
            {loading.users ? <tr><td colSpan="7" className="muted">Loading...</td></tr>
              : users.length === 0 ? <tr><td colSpan="7" className="muted">No users found. Click Load.</td></tr>
              : users.map(u => (
                <tr key={u._id}>
                  <td>{u.name || ''}</td><td>{u.email || ''}</td><td>{badge(u.role || '')}</td><td>{u.phone || '-'}</td>
                  <td>{u.isActive === false ? badge('inactive') : badge('active')}</td>
                  <td>{u.role === 'owner' ? (u.ownerVerified ? badge('approved') : badge('pending')) : '-'}</td>
                  <td><div className="form-actions" style={{ margin: 0 }}>
                    {u.role !== 'admin' ? <button className="btn btn-light" onClick={() => toggleUser(u)}>{u.isActive === false ? 'Activate' : 'Deactivate'}</button> : null}
                    {u.role === 'owner' ? <button className="btn btn-primary" onClick={() => verifyOwner(u)}>{u.ownerVerified ? 'Unverify' : 'Verify'}</button> : null}
                  </div></td>
                </tr>
              ))}
          </tbody></table></div>
      </section>

      <section className="panel">
        <div className="panel-header"><h2>Mess Listings</h2>
          <div className="form-actions" style={{ margin: 0 }}>
            <select id="listingStatusFilter" value={listingStatusFilter} onChange={e => setListingStatusFilter(e.target.value)}><option value="">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option></select>
            <input id="listingSearch" placeholder="Search listing/owner" value={listingSearch} onChange={e => setListingSearch(e.target.value)} />
            <button className="btn btn-light" id="loadListingsBtn" onClick={() => loadListings().catch(e => showToast(e.message, 'error'))}>Load</button>
          </div>
        </div>
        <div id="adminListings" className="list">
          {loading.listings ? <div className="loading-state">Loading...</div>
            : listings.length === 0 ? <div className="empty-state">No listings loaded. Click Load.</div>
            : listings.map(m => (
              <div className="list-item" key={m._id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}><h3 style={{ margin: 0 }}>{m.name}</h3><div>{badge(m.approvalStatus)} {badge(m.availabilityStatus)}</div></div>
                <div className="muted">Owner: {m.owner?.name || 'N/A'} ({m.owner?.email || ''}) • ₹{Number(m.price || 0)} • {[m.area, m.city].filter(Boolean).join(', ')}</div>
                {m.rejectionReason ? <div className="small-note" style={{ marginTop: '6px' }}><strong>Reason:</strong> {m.rejectionReason}</div> : null}
                <div className="form-actions">
                  <a className="btn btn-light" href={`/details.html?id=${encodeURIComponent(m._id)}`}>View</a>
                  <button className="btn btn-primary" onClick={() => setApproval(m._id, 'approved')}>Approve</button>
                  <button className="btn btn-warning" onClick={() => setApproval(m._id, 'rejected')}>Reject</button>
                  <button className="btn btn-danger" onClick={() => setApproval(m._id, 'suspended')}>Suspend</button>
                </div>
              </div>
            ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header"><h2>Reports</h2>
          <div className="form-actions" style={{ margin: 0 }}>
            <select id="reportStatusFilter" value={reportStatusFilter} onChange={e => setReportStatusFilter(e.target.value)}><option value="">All</option><option value="open">Open</option><option value="reviewed">Reviewed</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select>
            <button className="btn btn-light" id="loadReportsBtn" onClick={() => loadReports().catch(e => showToast(e.message, 'error'))}>Load</button>
          </div>
        </div>
        <div id="adminReports" className="list">
          {loading.reports ? <div className="loading-state">Loading...</div>
            : reports.length === 0 ? <div className="empty-state">No reports loaded. Click Load.</div>
            : reports.map(r => (
              <div className="list-item" key={r._id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}><h3 style={{ margin: 0 }}>{String(r.targetType || '').toUpperCase()} Report</h3>{badge(r.status)}</div>
                <div className="muted">Reporter: {r.reporter?.name || 'N/A'} ({r.reporter?.email || ''}) • Target ID: {r.targetId}</div>
                <div style={{ marginTop: '6px' }}><strong>Reason:</strong> {r.reason || ''}</div>
                {r.details ? <div><strong>Details:</strong> {r.details}</div> : null}
                {r.actionTaken ? <div><strong>Action:</strong> {r.actionTaken}</div> : null}
                <div className="form-actions">
                  <button className="btn btn-light" onClick={() => updateReport(r._id, 'reviewed')}>Mark Reviewed</button>
                  <button className="btn btn-primary" onClick={() => updateReport(r._id, 'resolved')}>Resolve</button>
                  <button className="btn btn-light" onClick={() => updateReport(r._id, 'dismissed')}>Dismiss</button>
                  {r.targetType === 'review' ? <>
                    <button className="btn btn-warning" onClick={() => hideReportedReview(r._id)}>Hide Reported Review</button>
                    <button className="btn btn-danger" onClick={() => deleteReportedReview(r._id)}>Delete Reported Review</button>
                  </> : null}
                </div>
              </div>
            ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header"><h2>Reviews Moderation</h2><button className="btn btn-light" id="loadReviewsBtn" onClick={() => loadReviews().catch(e => showToast(e.message, 'error'))}>Load</button></div>
        <div id="adminReviews" className="list">
          {loading.reviews ? <div className="loading-state">Loading...</div>
            : reviews.length === 0 ? <div className="empty-state">No reviews loaded. Click Load.</div>
            : reviews.map(r => (
              <div className="list-item" key={r._id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}><h3 style={{ margin: 0 }}>{r.mess?.name || 'Mess'}</h3><div>{r.isHidden ? badge('suspended') : badge('approved')}</div></div>
                <div className="muted">{r.user?.name || 'User'} ({r.user?.email || ''}) • {'★'.repeat(r.rating || 0)}{'☆'.repeat(5 - (r.rating || 0))}</div>
                <p style={{ marginTop: '6px' }}>{r.comment || ''}</p>
                <div className="form-actions">
                  <button className="btn btn-light" onClick={() => moderateReview(r)}>{r.isHidden ? 'Unhide' : 'Hide'}</button>
                  <button className="btn btn-danger" onClick={() => deleteReview(r._id)}>Delete</button>
                </div>
              </div>
            ))}
        </div>
      </section>
    </main>
  )
}
