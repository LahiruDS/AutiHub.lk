import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import StatusBadge from '../components/StatusBadge.jsx'
import { CardSkeleton, EmptyState } from '../components/Loader.jsx'
import { CUSTOMER_STATUS_TABS, formatMoney, formatDate, BOOKING } from '../config/constants.js'
import { useAuth } from '../context/AuthContext.jsx'

export const MyBookings = () => {
  const { user } = useAuth()
  const [tab, setTab] = useState('all')
  const [data, setData] = useState({ bookings: [], total: 0, pages: 1, page: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.get('/bookings/mine', { params: { status: tab, limit: 20 } }))
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    load()
  }, [load])

  const upcoming = data.bookings.filter((booking) => BOOKING.liveStatuses.includes(booking.status))
  const past = data.bookings.filter((booking) => !BOOKING.liveStatuses.includes(booking.status))

  const renderBooking = (booking) => (
    <Link
      key={booking.id}
      to={`/bookings/${booking.id}`}
      className="card card-hover"
      style={{ padding: 18 }}
    >
      <div className="row-between" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div className="row" style={{ gap: 9 }}>
            <span className="bold">{booking.station?.name || 'Station'}</span>
            <StatusBadge status={booking.status} />
          </div>
          <p className="tiny muted" style={{ marginTop: 3 }}>Ref {booking.reference}</p>
        </div>
        <span className="bold nowrap" style={{ color: 'var(--brand-dark)' }}>
          {formatMoney(booking.totalPrice)}
        </span>
      </div>

      <div className="row" style={{ marginTop: 12, gap: 16 }}>
        <span className="small muted">🗓️ {formatDate(booking.date)}</span>
        <span className="small muted">🕐 {booking.slotStart} - {booking.slotEnd}</span>
        {booking.vehicle && (
          <span className="small muted">🚗 {booking.vehicle.make} {booking.vehicle.model}</span>
        )}
      </div>

      {BOOKING.liveStatuses.includes(booking.status) && (
        <div style={{ marginTop: 14 }}>
          <div className="progress" style={{ height: 6 }}>
            <div
              className={`progress-bar ${booking.status === 'completed' ? 'ok' : ''}`}
              style={{ width: `${booking.progress || 0}%` }}
            />
          </div>
          <p className="tiny muted" style={{ marginTop: 6 }}>
            {booking.currentStepLabel || BOOKING.statuses[booking.status]?.label}
            {booking.progress ? ` · ${booking.progress}%` : ''}
          </p>
        </div>
      )}
    </Link>
  )

  return (
    <div className="container page">
      <div className="page-head">
        <h1>My bookings</h1>
        <p>Every job you booked, with live progress for the ones in progress.</p>
      </div>

      <div className="tabs">
        {CUSTOMER_STATUS_TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`tab ${tab === item.value ? 'active' : ''}`}
            onClick={() => setTab(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <CardSkeleton count={3} />
      ) : data.bookings.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🚗"
            title="No bookings here yet"
            message={user ? 'Book your first service and it will show up on this page.' : ''}
            action={<Link to="/stations" className="btn">Find a service station</Link>}
          />
        </div>
      ) : (
        <div className="stack" style={{ gap: 26 }}>
          {upcoming.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.15rem', marginBottom: 12 }}>Active & upcoming</h2>
              <div className="stack">{upcoming.map(renderBooking)}</div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.15rem', marginBottom: 12 }}>History</h2>
              <div className="stack">{past.map(renderBooking)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MyBookings