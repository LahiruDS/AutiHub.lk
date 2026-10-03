import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api.js'
import StatusBadge from '../../components/StatusBadge.jsx'
import { Spinner } from '../../components/Loader.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatMoney, formatDate, BOOKING } from '../../config/constants.js'

export const StationDashboard = () => {
  const { station, refresh } = useAuth()
  const [data, setData] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [dashboard, serviceStats] = await Promise.all([
        api.get('/stations/me/dashboard'),
        api.get('/services/stats')
      ])
      setData(dashboard)
      setStats(serviceStats)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 30000)
    return () => clearInterval(timer)
  }, [load])

  if (loading && !data) return <Spinner label="Loading dashboard..." />

  if (error && !data) {
    return (
      <div className="container page">
        <div className="alert alert-error">{error}</div>
        <button type="button" className="btn" onClick={() => { refresh(); load() }}>Try again</button>
      </div>
    )
  }

  const counts = data.statusCounts || {}

  const cards = [
    { label: 'Bookings today', value: data.today.length, icon: '📅', to: '/station/bookings', accent: '#2563eb' },
    { label: 'Pending requests', value: counts.pending || 0, icon: '⏳', to: '/station/bookings?status=pending', accent: '#f59e0b' },
    { label: 'In progress', value: counts.in_progress || 0, icon: '🛠️', to: '/station/bookings?status=in_progress', accent: '#06b6d4' },
    { label: 'Completed total', value: counts.completed || 0, icon: '✅', to: '/station/bookings?status=completed', accent: '#10b981' },
    { label: 'Upcoming', value: data.upcomingCount, icon: '📌', to: '/station/bookings', accent: '#8b5cf6' },
    { label: 'Revenue', value: formatMoney(stats?.totalRevenue || 0), icon: '💰', to: '/station/bookings?status=completed', accent: '#f97316' }
  ]

  return (
    <div className="container page">
      <div className="page-head row-between" style={{ marginBottom: 20 }}>
        <div>
          <div className="small" style={{ color: '#2563eb', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Service station overview
          </div>
          <h1 style={{ marginTop: 8 }}>{station?.name || 'Station dashboard'}</h1>
          <p style={{ marginTop: 8 }}>Today's work, upcoming bookings, and your station performance at a glance.</p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={load}>Refresh</button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 26 }}>
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="card card-hover"
            style={{
              padding: 18,
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
              borderLeft: `4px solid ${card.accent}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: '1.5rem' }}>{card.icon}</div>
              <span className="badge badge-blue" style={{ background: `${card.accent}1a`, color: card.accent }}>{card.label}</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.2 }}>{card.value}</div>
            <div className="small muted" style={{ marginTop: 6 }}>{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="split">
        <div className="card">
          <div className="row-between" style={{ marginBottom: 14 }}>
            <h3 className="card-title" style={{ marginBottom: 0 }}>Today's schedule</h3>
            <span className="badge">{data.today.length} job(s)</span>
          </div>

          {data.today.length === 0 ? (
            <p className="small muted">No bookings scheduled for today.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Vehicle</th>
                    <th>Customer</th>
                    <th>Services</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.today.map((booking) => (
                    <tr key={booking._id}>
                      <td className="bold nowrap" data-label="Time">{booking.slotStart}</td>
                      <td data-label="Vehicle">
                        <div className="bold small">
                          {booking.vehicle?.make} {booking.vehicle?.model}
                        </div>
                        <div className="tiny muted">{booking.vehicle?.registrationNumber}</div>
                      </td>
                      <td className="small" data-label="Customer">{booking.customer?.name}</td>
                      <td className="small muted" data-label="Services">{booking.items.length} service(s)</td>
                      <td data-label="Status"><StatusBadge status={booking.status} /></td>
                      <td className="right">
                        <Link to={`/station/bookings/${booking._id}`} className="btn btn-outline btn-sm">
                          {BOOKING.statuses[booking.status]?.label === 'Pending' ? 'Review' : 'Update'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="stack">
          <div className="card">
            <h3 className="card-title">Quick actions</h3>
            <div className="stack" style={{ gap: 9 }}>
              <Link to="/station/services" className="btn btn-block">Manage services & prices</Link>
              <Link to="/station/bookings" className="btn btn-outline btn-block">All bookings</Link>
              <Link to="/station/reviews" className="btn btn-outline btn-block">Read reviews</Link>
              <Link to="/station/profile" className="btn btn-outline btn-block">Station profile</Link>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Performance</h3>
            <div className="summary-row">
              <span className="muted">Rating</span>
              <span className="bold">
                <span className="stars">{'★'.repeat(Math.round(stats?.averageRating || 0))}</span>{' '}
                {stats?.averageRating || 0}
              </span>
            </div>
            <div className="summary-row">
              <span className="muted">Total reviews</span>
              <span className="bold">{stats?.reviewCount || 0}</span>
            </div>
            <div className="summary-row">
              <span className="muted">Active services</span>
              <span className="bold">{stats?.serviceCount || 0}</span>
            </div>
            <div className="summary-row">
              <span className="muted">All bookings</span>
              <span className="bold">{stats?.bookingCount || 0}</span>
            </div>
            <div className="summary-row total">
              <span>Earned</span>
              <span>{formatMoney(stats?.totalRevenue || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StationDashboard