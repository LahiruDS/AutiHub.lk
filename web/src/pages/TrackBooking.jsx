import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import useLiveStatus from '../hooks/useLiveStatus.js'
import StatusTimeline from '../components/StatusTimeline.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { Spinner } from '../components/Loader.jsx'
import { StarInput } from '../components/Ui.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { formatMoney, formatDate, formatDateTime } from '../config/constants.js'

export const TrackBooking = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const { booking, canReview, loading, error, updatedAt, isLive, refresh } = useLiveStatus(id)
  const [cancelling, setCancelling] = useState(false)

  const [reviewOpen, setReviewOpen] = useState(false)
  const [review, setReview] = useState({ rating: 0, title: '', comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)

  const cancel = async () => {
    if (!window.confirm('Cancel this booking? The station will be notified.')) return

    setCancelling(true)
    try {
      await api.patch(`/bookings/${id}/status`, { status: 'cancelled' })
      toast.success('Booking cancelled')
      refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCancelling(false)
    }
  }

  const submitReview = async (event) => {
    event.preventDefault()

    if (review.rating === 0) {
      toast.error('Please choose a star rating')
      return
    }

    setSubmittingReview(true)
    try {
      await api.post('/reviews', { bookingId: id, ...review })
      toast.success('Thanks for your review!')
      setReviewOpen(false)
      refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <Spinner label="Loading booking..." />

  if (error) {
    return (
      <div className="container page">
        <div className="alert alert-error">{error}</div>
        <Link to="/bookings" className="btn btn-outline">Back to my bookings</Link>
      </div>
    )
  }

  if (!booking) return null

  const cancellable = ['pending', 'confirmed'].includes(booking.status)

  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link to="/bookings">My bookings</Link>
        <span>/</span>
        <span>{booking.reference}</span>
      </div>

      <div className="row-between" style={{ marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: '1.7rem' }}>Booking {booking.reference}</h1>
          <p className="muted small" style={{ marginTop: 4 }}>
            {isLive ? (
              <span className="row" style={{ gap: 7 }}>
                <span className="live-dot" /> Live - refreshing every few seconds
              </span>
            ) : (
              `Last updated ${formatDateTime(updatedAt)}`
            )}
          </p>
        </div>

        <div className="row">
          {cancellable && (
            <button type="button" className="btn btn-outline btn-sm" onClick={cancel} disabled={cancelling}>
              {cancelling ? 'Cancelling...' : 'Cancel booking'}
            </button>
          )}
          {canReview && !reviewOpen && (
            <button type="button" className="btn btn-sm" onClick={() => setReviewOpen(true)}>
              Leave a review
            </button>
          )}
        </div>
      </div>

      {reviewOpen && (
        <div className="card" style={{ marginBottom: 22, borderColor: 'var(--brand)' }}>
          <h3 className="card-title">Rate this service</h3>
          <form onSubmit={submitReview}>
            <StarInput
              value={review.rating}
              onChange={(rating) => setReview((current) => ({ ...current, rating }))}
            />
            <div className="form-grid">
              <div className="field">
                <label htmlFor="reviewTitle">Headline</label>
                <input
                  id="reviewTitle"
                  className="input"
                  placeholder="Great work, car runs smooth"
                  value={review.title}
                  onChange={(event) => setReview((current) => ({ ...current, title: event.target.value }))}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="reviewComment">Your review</label>
              <textarea
                id="reviewComment"
                className="textarea"
                placeholder="How was the service? How long did it take?"
                value={review.comment}
                onChange={(event) => setReview((current) => ({ ...current, comment: event.target.value }))}
              />
            </div>
            <div className="row">
              <button type="submit" className="btn btn-ok" disabled={submittingReview}>
                {submittingReview ? 'Submitting...' : 'Submit review'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setReviewOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ marginBottom: 22 }}>
        <div className="grid grid-4" style={{ gap: 20 }}>
          <div>
            <p className="tiny muted bold" style={{ textTransform: 'uppercase' }}>Status</p>
            <div style={{ marginTop: 5 }}><StatusBadge status={booking.status} /></div>
          </div>
          <div>
            <p className="tiny muted bold" style={{ textTransform: 'uppercase' }}>Date</p>
            <p className="bold" style={{ marginTop: 5 }}>{formatDate(booking.date)}</p>
          </div>
          <div>
            <p className="tiny muted bold" style={{ textTransform: 'uppercase' }}>Time</p>
            <p className="bold" style={{ marginTop: 5 }}>{booking.slotStart} - {booking.slotEnd}</p>
          </div>
          <div>
            <p className="tiny muted bold" style={{ textTransform: 'uppercase' }}>Total</p>
            <p className="price-tag" style={{ marginTop: 5 }}>{formatMoney(booking.totalPrice)}</p>
          </div>
        </div>
      </div>

      {booking.statusMessage && (
        <div className={`alert ${['completed'].includes(booking.status) ? 'alert-ok' : 'alert-info'}`}>
          {booking.statusMessage}
        </div>
      )}

      <StatusTimeline booking={booking} />

      <div className="split" style={{ marginTop: 22 }}>
        <div className="card">
          <h3 className="card-title">Service details</h3>
          <div className="stack" style={{ gap: 9 }}>
            {booking.items.map((item, index) => (
              <div key={index} className="row-between">
                <div>
                  <span className="bold">{item.name}</span>
                  <span className="tiny muted" style={{ marginLeft: 8 }}>~{item.durationMinutes} min</span>
                </div>
                <span className="bold">{formatMoney(item.price)}</span>
              </div>
            ))}
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatMoney(booking.totalPrice)}</span>
          </div>

          {booking.customerNote && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--line)' }}>
              <p className="tiny muted bold" style={{ marginBottom: 4 }}>YOUR NOTE</p>
              <p className="small">{booking.customerNote}</p>
            </div>
          )}

          {booking.stationNote && (
            <div style={{ marginTop: 14 }}>
              <p className="tiny muted bold" style={{ marginBottom: 4 }}>NOTE FROM THE STATION</p>
              <p className="small">{booking.stationNote}</p>
            </div>
          )}
        </div>

        <div className="card sticky-side">
          <h3 className="card-title">Service station</h3>
          {booking.station && (
            <>
              <p className="bold">{booking.station.name}</p>
              <p className="small muted">
                {[booking.station.address?.line1, booking.station.address?.city]
                  .filter(Boolean)
                  .join(', ')}
              </p>

              <div className="row" style={{ marginTop: 12, gap: 8 }}>
                <a href={`tel:${booking.station.phone}`} className="btn btn-outline btn-sm">Call</a>
                <Link to={`/stations/${booking.station.slug || booking.station._id}`} className="btn btn-outline btn-sm">
                  Station page
                </Link>
              </div>

              {booking.station.rating?.count > 0 && (
                <p className="small muted" style={{ marginTop: 14 }}>
                  <span className="stars">{'★'.repeat(Math.round(booking.station.rating.average))}</span>{' '}
                  {booking.station.rating.average} from {booking.station.rating.count} reviews
                </p>
              )}
            </>
          )}

          {booking.vehicle && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--line)' }}>
              <p className="tiny muted bold" style={{ marginBottom: 4 }}>YOUR VEHICLE</p>
              <p className="bold small">
                {booking.vehicle.make} {booking.vehicle.model}
              </p>
              <p className="small muted">{booking.vehicle.registrationNumber}</p>
            </div>
          )}

          <button type="button" className="btn btn-ghost btn-block btn-sm" style={{ marginTop: 16 }} onClick={() => navigate('/bookings')}>
            All my bookings
          </button>
        </div>
      </div>
    </div>
  )
}

export default TrackBooking