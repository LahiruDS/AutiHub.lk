import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { EmptyState } from '../components/Loader.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { timeAgo } from '../config/constants.js'

const ICONS = {
  booking_requested: '📨',
  booking_created: '📅',
  booking_confirmed: '✅',
  booking_in_progress: '🔧',
  booking_on_hold: '⏸️',
  booking_completed: '🎉',
  booking_cancelled: '❌',
  review_added: '⭐',
  review_reply: '💬',
  welcome: '👋',
  station_registered: '🏪'
}

export const Notifications = () => {
  const { setUnreadCount } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadOnly, setUnreadOnly] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/notifications', { params: { unreadOnly, limit: 40 } })
      setItems(data.notifications || [])
      setUnreadCount(data.unread || 0)
    } finally {
      setLoading(false)
    }
  }, [unreadOnly, setUnreadCount])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const timer = setInterval(load, 30000)
    return () => clearInterval(timer)
  }, [load])

  const markAll = async () => {
    await api.patch('/notifications/read-all')
    load()
  }

  const remove = async (id) => {
    await api.delete(`/notifications/${id}`)
    load()
  }

  return (
    <div className="container page">
      <div className="page-head row-between">
        <div>
          <h1>Notifications</h1>
          <p>Booking updates, confirmations and replies.</p>
        </div>
        <div className="row">
          <label className="row small" style={{ gap: 6, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(event) => setUnreadOnly(event.target.checked)}
              style={{ accentColor: 'var(--brand)' }}
            />
            Unread only
          </label>
          <button type="button" className="btn btn-outline btn-sm" onClick={markAll}>Mark all read</button>
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 200 }} />
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🔔"
            title="Nothing here yet"
            message="Booking updates will show up here as soon as they happen."
            action={<Link to="/bookings" className="btn btn-outline">View my bookings</Link>}
          />
        </div>
      ) : (
        <div className="stack" style={{ gap: 10 }}>
          {items.map((item) => (
            <div
              key={item.id}
              className="card row-between"
              style={{
                alignItems: 'flex-start',
                borderColor: item.read ? 'var(--line)' : 'var(--brand)',
                background: item.read ? '#fff' : 'var(--brand-soft)'
              }}
            >
              <div style={{ flex: 1 }}>
                <div className="row" style={{ gap: 8 }}>
                  <span style={{ fontSize: '1.1rem' }}>{ICONS[item.type] || '🔔'}</span>
                  <span className="bold small">{item.title}</span>
                  {!item.read && <span className="badge badge-blue tiny">New</span>}
                </div>
                <p className="small muted" style={{ marginTop: 4 }}>{item.body}</p>
                <p className="tiny muted" style={{ marginTop: 4 }}>{timeAgo(item.createdAt)}</p>
              </div>

              <div className="row" style={{ gap: 6 }}>
                {item.booking && (
                  <Link to={`/bookings/${item.booking}`} className="btn btn-outline btn-sm">View</Link>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => remove(item.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notifications