import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api.js'
import StatusTimeline from '../../components/StatusTimeline.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { Spinner } from '../../components/Loader.jsx'
import useLiveStatus from '../../hooks/useLiveStatus.js'
import { useToast } from '../../context/ToastContext.jsx'
import { formatMoney, formatDate, WORKFLOW_STEPS, BOOKING } from '../../config/constants.js'

const NEXT_ACTIONS = {
  pending: [{ status: 'confirmed', label: 'Confirm booking', tone: 'btn' }, { status: 'cancelled', label: 'Decline', tone: 'btn-outline' }],
  confirmed: [{ status: 'in_progress', label: 'Start work', tone: 'btn' }, { status: 'cancelled', label: 'Cancel', tone: 'btn-outline' }],
  in_progress: [{ status: 'completed', label: 'Mark completed', tone: 'btn-ok' }, { status: 'on_hold', label: 'Put on hold', tone: 'btn-outline' }],
  on_hold: [{ status: 'in_progress', label: 'Resume work', tone: 'btn' }, { status: 'cancelled', label: 'Cancel', tone: 'btn-outline' }]
}

/** Station-side screen for one job. Everything the customer sees is set here. */
export const StationBookingManage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const { booking, loading, error, refresh } = useLiveStatus(id, { active: true })
  const [note, setNote] = useState('')
  const [currentStep, setCurrentStep] = useState('')
  const [saving, setSaving] = useState(false)

  const update = async (payload, successMessage) => {
    setSaving(true)
    try {
      await api.patch(`/bookings/${id}/status`, payload)
      toast.success(successMessage)
      setNote('')
      refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Loading booking..." />

  if (error) {
    return (
      <div className="container page">
        <div className="alert alert-error">{error}</div>
        <Link to="/station/bookings" className="btn btn-outline">Back to bookings</Link>
      </div>
    )
  }

  if (!booking) return null

  const actions = NEXT_ACTIONS[booking.status] || []
  const closed = ['completed', 'cancelled', 'no_show'].includes(booking.status)

  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link to="/station/bookings">Bookings</Link>
        <span>/</span>
        <span>{booking.reference}</span>
      </div>

      <div className="row-between" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.7rem' }}>{booking.reference}</h1>
          <p className="muted small" style={{ marginTop: 4 }}>
            {formatDate(booking.date)} Â· {booking.slotStart} - {booking.slotEnd}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {booking.customer && (
        <div className="card" style={{ marginBottom: 22 }}>
          <div className="grid grid-4" style={{ gap: 20 }}>
            <div>
              <p className="tiny muted bold" style={{ textTransform: 'uppercase' }}>Customer</p>
              <p className="bold" style={{ marginTop: 5 }}>{booking.customer.name}</p>
              <a href={`tel:${booking.customer.phone}`} className="small">{booking.customer.phone}</a>
            </div>

            <div>
              <p className="tiny muted bold" style={{ textTransform: 'uppercase' }}>Vehicle</p>
              {booking.vehicle ? (
                <>
                  <p className="bold" style={{ marginTop: 5 }}>{booking.vehicle.make} {booking.vehicle.model}</p>
                  <p className="small muted">{booking.vehicle.registrationNumber}</p>
                </>
              ) : (
                <p className="muted small" style={{ marginTop: 5 }}>Not specified</p>
              )}
            </div>

            <div>
              <p className="tiny muted bold" style={{ textTransform: 'uppercase' }}>Total</p>
              <p className="price-tag" style={{ marginTop: 5 }}>{formatMoney(booking.totalPrice)}</p>
              <p className="tiny muted">{booking.items.length} service(s)</p>
            </div>

            <div>
              <p className="tiny muted bold" style={{ textTransform: 'uppercase' }}>Payment</p>
              <div style={{ marginTop: 5 }}>
                <select
                  className="select"
                  value={booking.paymentStatus}
                  onChange={(event) => update({ paymentStatus: event.target.value }, 'Payment status updated')}
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>

          {booking.customerNote && (
            <div className="alert alert-warn" style={{ marginTop: 18, marginBottom: 0 }}>
              <b>Customer note:</b> {booking.customerNote}
            </div>
          )}
        </div>
      )}

      <div className="split">
        <div className="stack">
          <div className="card">
            <h3 className="card-title">Requested services</h3>
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
          </div>

          <div className="card">
            <h3 className="card-title">Work steps</h3>

            {booking.steps?.length > 0 ? (
              <>
                <p className="small muted" style={{ marginBottom: 12 }}>
                  Pick the step you are working on. The customer sees this instantly.
                </p>

                <div className="row" style={{ gap: 8, marginBottom: 16 }}>
                  {booking.steps.map((step) => (
                    <button
                      key={step}
                      type="button"
                      className={`btn btn-sm ${booking.currentStep === step ? '' : 'btn-outline'}`}
                      disabled={closed || saving}
                      onClick={() => update({ status: 'in_progress', currentStep: step }, `Now on: ${WORKFLOW_STEPS[step] || step}`)}
                    >
                      {WORKFLOW_STEPS[step] || step}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="small muted">No workflow steps mapped to this booking.</p>
            )}

            {!closed && (
              <div className="field" style={{ marginBottom: 10 }}>
                <label htmlFor="note">Note for the customer</label>
                <textarea
                  id="note"
                  className="textarea"
                  placeholder="Parts ordered, waiting for approval, extra work needed..."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>
            )}

            {!closed && note.trim() && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={saving}
                onClick={() => update({ note }, 'Note added')}
              >
                Add note
              </button>
            )}

            {booking.stationNote && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--line)' }}>
                <p className="tiny muted bold" style={{ marginBottom: 4 }}>CURRENT NOTE</p>
                <p className="small">{booking.stationNote}</p>
              </div>
            )}
          </div>

          <StatusTimeline booking={booking} />
        </div>

        <div className="sticky-side stack">
          <div className="card">
            <h3 className="card-title">Actions</h3>

            {closed ? (
              <div className="alert alert-info" style={{ marginBottom: 0 }}>
                This booking is {BOOKING.statuses[booking.status]?.label.toLowerCase()}. No further changes.
              </div>
            ) : (
              <div className="stack" style={{ gap: 9 }}>
                {actions.map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    className={`btn btn-block ${action.tone}`}
                    disabled={saving}
                    onClick={() =>
                      update(
                        { status: action.status, note: note || undefined },
                        `Marked as ${BOOKING.statuses[action.status]?.label.toLowerCase()}`
                      )
                    }
                  >
                    {action.label}
                  </button>
                ))}

                <select
                  className="select"
                  value={currentStep}
                  onChange={(event) => setCurrentStep(event.target.value)}
                >
                  <option value="">Jump to step (optional)</option>
                  {(booking.steps || []).map((step) => (
                    <option key={step} value={step}>{WORKFLOW_STEPS[step] || step}</option>
                  ))}
                </select>

                {currentStep && (
                  <button
                    type="button"
                    className="btn btn-outline btn-block"
                    disabled={saving}
                    onClick={() => update({ status: 'in_progress', currentStep }, 'Step updated')}
                  >
                    Set as current step
                  </button>
                )}
              </div>
            )}
          </div>

          <button type="button" className="btn btn-ghost btn-block" onClick={() => navigate('/station/bookings')}>
            Back to all bookings
          </button>
        </div>
      </div>
    </div>
  )
}

export default StationBookingManage