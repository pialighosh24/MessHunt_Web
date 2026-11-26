import { useEffect, useState } from 'react'
import { MHApi } from '../services/api'
import { showToast } from '../services/ui'

function badge(status) {
  const s = String(status || '').toLowerCase()
  const map = { approved: 'success', active: 'success', resolved: 'success', pending: 'warn', reviewed: 'warn', open: 'warn', rejected: 'danger', suspended: 'danger', inactive: 'danger', dismissed: 'gray', cancelled: 'gray', hidden: 'danger' }
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
  const [listingNotes, setListingNotes] = useState({})
  const [reportNotes, setReportNotes] = useState({})
  const [loading, setLoading] = useState({ users: false, listings: false, reports: false, reviews: false })

  const loadStats = async () => {
    const res = await MHApi.request('/api/admin/dashboard')
    setStats(res.data)
  }

  const loadUsers = async (roleOverride = userRoleFilter, searchOverride = userSearch) => {
    setLoading(l => ({ ...l, users: true }))
    try {
      const qs = new URLSearchParams()
      if (roleOverride) qs.set('role', roleOverride)
      if (String(searchOverride || '').trim()) qs.set('search', String(searchOverride).trim())
      const res = await MHApi.request(`/api/admin/users?${qs.toString()}`)
      setUsers(res.data || [])
    } finally {
      setLoading(l => ({ ...l, users: false }))
    }
  }

  const loadListings = async (statusOverride = listingStatusFilter, searchOverride = listingSearch) => {
    setLoading(l => ({ ...l, listings: true }))
    try {
      const qs = new URLSearchParams()
      if (statusOverride) qs.set('status', statusOverride)
      if (String(searchOverride || '').trim()) qs.set('search', String(searchOverride).trim())
      const res = await MHApi.request(`/api/admin/messes?${qs.toString()}`)
      const list = res.data || []
      setListings(list)
      const notesMap = {}
      list.forEach(m => { notesMap[m._id] = m.rejectionReason || '' })
      setListingNotes(notesMap)
    } finally {
      setLoading(l => ({ ...l, listings: false }))
    }
  }

  const loadReports = async (statusOverride = reportStatusFilter) => {
    setLoading(l => ({ ...l, reports: true }))
    try {
      const qs = new URLSearchParams()
      if (statusOverride) qs.set('status', statusOverride)
      const res = await MHApi.request(`/api/admin/reports?${qs.toString()}`)
      const list = res.data || []
      setReports(list)
      const notesMap = {}
      list.forEach(r => { notesMap[r._id] = r.adminNote || '' })
      setReportNotes(notesMap)
    } finally {
      setLoading(l => ({ ...l, reports: false }))
    }
  }

  const loadReviews = async () => {
    setLoading(l => ({ ...l, reviews: true }))
    try {
      const res = await MHApi.request('/api/admin/reviews')
      setReviews(res.data || [])
    } finally {
      setLoading(l => ({ ...l, reviews: false }))
    }
  }

  useEffect(() => {
    document.title = 'Admin Dashboard | MessHunt'
    Promise.all([loadStats(), loadUsers('', ''), loadListings('', ''), loadReports(''), loadReviews()])
      .catch(e => setAlert(e.message || 'Failed to load admin dashboard.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleUser = async (u) => {
    try {
      await MHApi.request(`/api/admin/users/${encodeURIComponent(u._id)}`, { method: 'PATCH', body: JSON.stringify({ isActive: u.isActive === false }) })
      await Promise.all([loadStats(), loadUsers()])
      showToast('User status updated', 'success')
    } catch (e) { showToast(e.message || 'Failed', 'error') }
  }

  const verifyOwner = async (u) => {
    try {
      await MHApi.request(`/api/admin/users/${encodeURIComponent(u._id)}`, { method: 'PATCH', body: JSON.stringify({ ownerVerified: !u.ownerVerified }) })
      await loadUsers()
      showToast('Owner verification updated', 'success')
    } catch (e) { showToast(e.message || 'Failed', 'error') }
  }

  const setApproval = async (id, status) => {
    const reason = (listingNotes[id] || '').trim()
    try {
      await MHApi.request(`/api/admin/messes/${encodeURIComponent(id)}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ approvalStatus: status, rejectionReason: reason })
      })
      showToast(`Listing marked ${status}`, 'success')
      await Promise.all([loadStats(), loadListings()])
    } catch (e) { showToast(e.message || 'Failed to update listing', 'error') }
  }

  const deleteListing = async (id) => {
    if (!window.confirm('Delete this mess listing permanently?')) return
    try {
      await MHApi.request(`/api/messes/${encodeURIComponent(id)}`, { method: 'DELETE' })
      showToast('Mess listing deleted', 'success')
      await Promise.all([loadStats(), loadListings(), loadReviews()])
    } catch (e) { showToast(e.message || 'Failed to delete listing', 'error') }
  }

  const updateReport = async (id, status, extra = {}) => {
    const note = (reportNotes[id] || '').trim()
    try {
      await MHApi.request(`/api/admin/reports/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, adminNote: note, ...extra })
      })
      showToast(`Report marked ${status}`, 'success')
      await Promise.all([loadStats(), loadReports(), loadListings(), loadReviews()])
    } catch (e) { showToast(e.message || 'Failed to update report', 'error') }
  }

  const deleteReportItem = async (id) => {
    if (!window.confirm('Delete this report permanently?')) return
    try {
      await MHApi.request(`/api/admin/reports/${encodeURIComponent(id)}`, { method: 'DELETE' })
      showToast('Report deleted', 'success')
      await Promise.all([loadStats(), loadReports()])
    } catch (e) { showToast(e.message || 'Failed to delete report', 'error') }
  }

  const moderateReview = async (r) => {
    try {
      await MHApi.request(`/api/admin/reviews/${encodeURIComponent(r._id)}/moderate`, {
        method: 'PATCH',
        body: JSON.stringify({ isHidden: !r.isHidden })
      })
      showToast(r.isHidden ? 'Review unhidden' : 'Review hidden', 'success')
      await Promise.all([loadStats(), loadReviews(), loadListings()])
    } catch (e) { showToast(e.message || 'Failed to moderate review', 'error') }
  }

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review permanently?')) return
    try {
      await MHApi.request(`/api/reviews/${encodeURIComponent(id)}`, { method: 'DELETE' })
      showToast('Review deleted', 'success')
      await Promise.all([loadStats(), loadReviews(), loadListings()])
    } catch (e) { showToast(e.message || 'Failed to delete review', 'error') }
  }

  const refreshAll = async () => {
    try {
      await Promise.all([loadStats(), loadUsers(), loadListings(), loadReports(), loadReviews()])
      showToast('All admin data refreshed', 'success')
    } catch (e) { showToast(e.message || 'Refresh failed', 'error') }
  }

  return (
    <main className="page-wrap">
      <div className="page-header">
        <div>
          <div className="eyebrow">ADMIN PORTAL</div>
          <h1>Admin Dashboard</h1>
          <p>Monitor platform activity and manage users, listings, reports and reviews.</p>
        </div>
        <button className="btn btn-light" id="refreshAll" onClick={refreshAll}>Refresh All</button>
      </div>
      <div id="adminAlert">{alert ? <div className="alert error">{alert}</div> : null}</div>

      <section className="grid-4" id="adminStats">
        <div className="stat-card"><div className="label">Students</div><div className="value" id="aStudents">{stats ? (stats.totalStudents ?? stats.users?.totalStudents ?? 0) : '-'}</div></div>
        <div className="stat-card"><div className="label">Owners</div><div className="value" id="aOwners">{stats ? (stats.totalOwners ?? stats.users?.totalOwners ?? 0) : '-'}</div></div>
        <div className="stat-card"><div className="label">Listings (Pending/Approved)</div><div className="value" id="aListings">{stats ? `${stats.pendingMesses ?? stats.listings?.pending ?? 0}/${stats.approvedMesses ?? stats.listings?.approved ?? 0}` : '-'}</div></div>
        <div className="stat-card"><div className="label">Open Reports</div><div className="value" id="aReports">{stats ? (stats.openReports ?? stats.reports?.open ?? 0) : '-'}</div></div>
      </section>

      <section className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-header">
          <h2>Users ({users.length})</h2>
          <div className="form-actions" style={{ margin: 0 }}>
            <select
              id="userRoleFilter"
              value={userRoleFilter}
              onChange={e => { const v = e.target.value; setUserRoleFilter(v); loadUsers(v, userSearch) }}
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
            </select>
            <input
              id="userSearch"
              placeholder="Search name/email"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') loadUsers(userRoleFilter, userSearch) }}
            />
            <button className="btn btn-light" id="loadUsersBtn" onClick={() => loadUsers().catch(e => showToast(e.message, 'error'))}>Load</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Status</th><th>Owner Verified</th><th>Actions</th></tr>
            </thead>
            <tbody id="usersTbody">
              {loading.users ? <tr><td colSpan="7" className="muted">Loading users...</td></tr>
                : users.length === 0 ? <tr><td colSpan="7" className="muted">No users found matching your filter.</td></tr>
                : users.map(u => (
                  <tr key={u._id}>
                    <td>{u.name || ''}</td>
                    <td>{u.email || ''}</td>
                    <td>{badge(u.role || '')}</td>
                    <td>{u.phone || '-'}</td>
                    <td>{u.isActive === false ? badge('inactive') : badge('active')}</td>
                    <td>{u.role === 'owner' ? (u.ownerVerified ? badge('approved') : badge('pending')) : '-'}</td>
                    <td>
                      <div className="form-actions" style={{ margin: 0 }}>
                        {u.role !== 'admin' ? <button className="btn btn-light" onClick={() => toggleUser(u)}>{u.isActive === false ? 'Activate' : 'Deactivate'}</button> : null}
                        {u.role === 'owner' ? <button className="btn btn-primary" onClick={() => verifyOwner(u)}>{u.ownerVerified ? 'Unverify' : 'Verify'}</button> : null}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Mess Listings ({listings.length})</h2>
          <div className="form-actions" style={{ margin: 0 }}>
            <select
              id="listingStatusFilter"
              value={listingStatusFilter}
              onChange={e => { const v = e.target.value; setListingStatusFilter(v); loadListings(v, listingSearch) }}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
            <input
              id="listingSearch"
              placeholder="Search listing/owner"
              value={listingSearch}
              onChange={e => setListingSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') loadListings(listingStatusFilter, listingSearch) }}
            />
            <button className="btn btn-light" id="loadListingsBtn" onClick={() => loadListings().catch(e => showToast(e.message, 'error'))}>Load</button>
          </div>
        </div>
        <div id="adminListings" className="list">
          {loading.listings ? <div className="loading-state">Loading listings...</div>
            : listings.length === 0 ? <div className="empty-state">No mess listings match the current filter.</div>
            : listings.map(m => {
              const isApproved = m.approvalStatus === 'approved'
              const isPending = m.approvalStatus === 'pending'
              const isRejected = m.approvalStatus === 'rejected'
              const isSuspended = m.approvalStatus === 'suspended'
              return (
                <div className="list-item" key={m._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>{m.name}</h3>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {badge(m.approvalStatus)} {badge(m.availabilityStatus)}
                    </div>
                  </div>
                  <div className="muted" style={{ marginTop: '4px' }}>
                    Dashboard Owner: <strong>{m.owner?.name || 'N/A'}</strong> ({m.owner?.email || ''})
                    {m.ownerName ? <> • Proprietor: <strong>{m.ownerName}</strong></> : null}
                    {' • '}₹{Number(m.price || 0)}/mo{m.totalRooms ? ` • ${m.totalRooms} Rooms` : ''} • {[m.area, m.city].filter(Boolean).join(', ')}
                    {' • '}⭐ {Number(m.averageRating || 0).toFixed(1)} ({m.reviewCount || 0})
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={listingNotes[m._id] ?? ''}
                      onChange={e => setListingNotes(prev => ({ ...prev, [m._id]: e.target.value }))}
                      placeholder="Optional admin moderation note / rejection reason..."
                      style={{ flex: 1, minWidth: '220px', padding: '7px 10px', border: '1px solid #d9e1ec', borderRadius: '8px', fontSize: '0.88rem' }}
                    />
                  </div>
                  <div className="form-actions" style={{ marginTop: '8px' }}>
                    <a className="btn btn-light" href={`/details.html?id=${encodeURIComponent(m._id)}`}>View</a>
                    <button type="button" className="btn btn-primary" disabled={isApproved} style={isApproved ? { opacity: 0.65, cursor: 'default' } : undefined} onClick={() => setApproval(m._id, 'approved')}>{isApproved ? '✓ Approved' : 'Approve'}</button>
                    <button type="button" className="btn btn-light" disabled={isPending} style={isPending ? { opacity: 0.65, cursor: 'default' } : undefined} onClick={() => setApproval(m._id, 'pending')}>{isPending ? '• Pending' : 'Mark Pending'}</button>
                    <button type="button" className="btn btn-warning" disabled={isRejected} style={isRejected ? { opacity: 0.65, cursor: 'default' } : undefined} onClick={() => setApproval(m._id, 'rejected')}>{isRejected ? '✗ Rejected' : 'Reject'}</button>
                    <button type="button" className="btn btn-danger" disabled={isSuspended} style={isSuspended ? { opacity: 0.65, cursor: 'default' } : undefined} onClick={() => setApproval(m._id, 'suspended')}>{isSuspended ? '⊘ Suspended' : 'Suspend'}</button>
                    <button type="button" className="btn btn-danger" onClick={() => deleteListing(m._id)}>Delete</button>
                  </div>
                </div>
              )
            })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Reports ({reports.length})</h2>
          <div className="form-actions" style={{ margin: 0 }}>
            <select
              id="reportStatusFilter"
              value={reportStatusFilter}
              onChange={e => { const v = e.target.value; setReportStatusFilter(v); loadReports(v) }}
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <button className="btn btn-light" id="loadReportsBtn" onClick={() => loadReports().catch(e => showToast(e.message, 'error'))}>Load</button>
          </div>
        </div>
        <div id="adminReports" className="list">
          {loading.reports ? <div className="loading-state">Loading reports...</div>
            : reports.length === 0 ? <div className="empty-state">No open or past reports found. When a user clicks "Report Listing" or "Report" on a review, it appears here for moderation.</div>
            : reports.map(r => (
              <div className="list-item" key={r._id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>{String(r.targetType || '').toUpperCase()} Report</h3>
                  {badge(r.status)}
                </div>
                <div className="muted" style={{ marginTop: '4px' }}>
                  Reporter: <strong>{r.reporter?.name || 'User'}</strong> ({r.reporter?.email || ''})
                  {r.targetSummary ? <> • <strong>{r.targetSummary}</strong></> : <> • Target ID: {r.targetId}</>}
                </div>
                <div style={{ marginTop: '6px' }}><strong>Reason:</strong> {r.reason || ''}</div>
                {r.details ? <div style={{ marginTop: '2px' }}><strong>Details:</strong> {r.details}</div> : null}
                {r.actionTaken ? <div style={{ marginTop: '2px', color: '#15803d' }}><strong>Action Taken:</strong> {r.actionTaken}</div> : null}
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={reportNotes[r._id] ?? ''}
                    onChange={e => setReportNotes(prev => ({ ...prev, [r._id]: e.target.value }))}
                    placeholder="Optional admin resolution note..."
                    style={{ flex: 1, minWidth: '220px', padding: '7px 10px', border: '1px solid #d9e1ec', borderRadius: '8px', fontSize: '0.88rem' }}
                  />
                </div>
                <div className="form-actions" style={{ marginTop: '8px' }}>
                  <button type="button" className="btn btn-light" onClick={() => updateReport(r._id, 'reviewed')}>Mark Reviewed</button>
                  <button type="button" className="btn btn-primary" onClick={() => updateReport(r._id, 'resolved')}>Resolve</button>
                  <button type="button" className="btn btn-light" onClick={() => updateReport(r._id, 'dismissed')}>Dismiss</button>
                  {r.targetType === 'mess' && r.targetId ? (
                    <>
                      <a className="btn btn-light" href={`/details.html?id=${encodeURIComponent(r.targetId)}`}>View Mess</a>
                      <button type="button" className="btn btn-warning" onClick={() => updateReport(r._id, 'resolved', { suspendMess: true })}>Suspend Reported Mess</button>
                    </>
                  ) : null}
                  {r.targetType === 'review' ? (
                    <>
                      <button type="button" className="btn btn-warning" onClick={() => updateReport(r._id, 'resolved', { hideReview: true, actionTaken: 'Review hidden by admin' })}>Hide Reported Review</button>
                      <button type="button" className="btn btn-danger" onClick={() => updateReport(r._id, 'resolved', { deleteReview: true, actionTaken: 'Review deleted by admin' })}>Delete Reported Review</button>
                    </>
                  ) : null}
                  <button type="button" className="btn btn-danger" onClick={() => deleteReportItem(r._id)}>Delete Report</button>
                </div>
              </div>
            ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Reviews Moderation ({reviews.length})</h2>
          <button className="btn btn-light" id="loadReviewsBtn" onClick={() => loadReviews().catch(e => showToast(e.message, 'error'))}>Load</button>
        </div>
        <div id="adminReviews" className="list">
          {loading.reviews ? <div className="loading-state">Loading reviews...</div>
            : reviews.length === 0 ? <div className="empty-state">No student reviews submitted yet. When a student submits a review on any mess page, it will appear here for moderation.</div>
            : reviews.map(r => {
              const starCount = Math.max(0, Math.min(5, Math.round(Number(r.rating) || 0)))
              const stars = '★'.repeat(starCount) + '☆'.repeat(5 - starCount)
              const messId = r.mess?._id || r.mess || ''
              return (
                <div className="list-item" key={r._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>{r.mess?.name || 'Mess'}</h3>
                    <div>{r.isHidden ? badge('hidden') : badge('approved')}</div>
                  </div>
                  <div className="muted" style={{ marginTop: '4px' }}>
                    Student: <strong>{r.user?.name || 'User'}</strong> ({r.user?.email || ''}) • <span style={{ color: '#f59e0b', fontWeight: 700 }}>{stars} ({Number(r.rating || 0).toFixed(1)}/5)</span>
                  </div>
                  <p style={{ marginTop: '6px' }}>{r.comment || ''}</p>
                  <div className="form-actions" style={{ marginTop: '8px' }}>
                    {messId ? <a className="btn btn-light" href={`/details.html?id=${encodeURIComponent(messId)}#reviewsPanel`}>View on Mess Page</a> : null}
                    <button type="button" className="btn btn-light" onClick={() => moderateReview(r)}>{r.isHidden ? 'Unhide Review' : 'Hide Review'}</button>
                    <button type="button" className="btn btn-danger" onClick={() => deleteReview(r._id)}>Delete Review</button>
                  </div>
                </div>
              )
            })}
        </div>
      </section>
    </main>
  )
}
