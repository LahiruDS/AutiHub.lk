import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { EmptyState } from '../../components/Loader.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { Stars } from '../../components/StationCard.jsx'
import { formatDateTime } from '../../config/constants.js'

export const StationReviews = () => {
  const toast = useToast()
  const { station } = useAuth()

  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [replying, setReplying] = useState({})
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!station?._id) return setLoading(false)

    setLoading(true)
    try {
      const [data, serviceStats] = await Promise.all([
        api.get(`/reviews/station/${station._id}`, { params: { limit: 50 } }),
        api.get('/services/stats')
      ])
      setReviews(data.reviews || [])
      setStats(serviceStats)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [station])

  useEffect(() => {
    load()
  }, [load])

  const reply = async (review) => {
    const text = replying[review.id]
    if (!text?.trim()) return

    try {
      await api.patch(`/reviews/${review.id}/reply`, { reply: text })
      toast.success('Reply posted')
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const toggle = async (review) => {
    try {
      await api.patch(`/reviews/${review.id}/visibility`)
      toast.success(review.isHidden ? 'Review is now visible' : 'Review hidden')
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Customer reviews</h1>
        <p>Only customers who completed a service can leave a review.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {stats && stats.reviewCount > 0 && (
        <div className="card" style={{ marginBottom: 22 }}>
          <div className="row-between">
            <div>
              <Stars value={stats.averageRating} count={stats.reviewCount} />
              <p className="small muted" style={{ marginTop: 4 }}>
                {stats.reviewCount} review(s) from completed jobs
              </p>
            </div>
            <div className="right">
              <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{stats.averageRating}</div>
              <p className="tiny muted">out of 5</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="skeleton" style={{ height: 200 }} />
      ) : reviews.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="⭐"
            title="No reviews yet"
            message="Reviews appear here after customers complete a service at your station."
          />
        </div>
      ) : (
        <div className="stack">
          {reviews.map((review) => (
            <div key={review.id} className="card">
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div className="row" style={{ gap: 9 }}>
                    <span className="bold">{review.customer?.name || 'Customer'}</span>
                    <span className="stars">{'★'.repeat(review.rating)}<span style={{ color: 'var(--line)' }}>{'★'.repeat(5 - review.rating)}</span></span>
                    {review.isHidden && <span className="badge badge-red">Hidden</span>}
                  </div>
                  <p className="tiny muted" style={{ marginTop: 2 }}>
                    {formatDateTime(review.createdAt)}
                    {review.vehicle && ` · ${review.vehicle.make} ${review.vehicle.model}`}
                  </p>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggle(review)}>
                  {review.isHidden ? 'Show' : 'Hide'}
                </button>
              </div>

              {review.title && <p className="bold" style={{ marginTop: 10 }}>{review.title}</p>}
              {review.comment && <p className="small" style={{ marginTop: 4 }}>{review.comment}</p>}

              {(review.serviceQuality || review.punctuality || review.staffBehaviour) && (
                <div className="row tiny muted" style={{ gap: 16, marginTop: 10 }}>
                  {review.serviceQuality && <span>Quality {review.serviceQuality}/5</span>}
                  {review.punctuality && <span>Punctuality {review.punctuality}/5</span>}
                  {review.staffBehaviour && <span>Staff {review.staffBehaviour}/5</span>}
                </div>
              )}

              {review.stationReply ? (
                <div className="alert alert-info" style={{ marginTop: 14, marginBottom: 0 }}>
                  <b>Your reply:</b> {review.stationReply}
                </div>
              ) : (
                <div style={{ marginTop: 14 }}>
                  <textarea
                    className="textarea"
                    placeholder="Reply publicly to this review..."
                    value={replying[review.id] || ''}
                    onChange={(event) => setReplying((current) => ({ ...current, [review.id]: event.target.value }))}
                  />
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ marginTop: 8 }}
                    onClick={() => reply(review)}
                  >
                    Post reply
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StationReviews