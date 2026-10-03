import { WORKFLOW_STEPS, BOOKING, formatDateTime, timeAgo } from '../config/constants.js'
import StatusBadge from './StatusBadge.jsx'

const isDone = (booking, step) => {
  if (booking.status === 'completed') return true
  if (!['in_progress', 'on_hold'].includes(booking.status)) return false
  const index = booking.steps.indexOf(step)
  if (index === -1) return false
  return index < booking.steps.indexOf(booking.currentStep)
}

const isCurrent = (booking, step) =>
  ['in_progress', 'on_hold'].includes(booking.status) && booking.currentStep === step

/**
 * The "live progress" panel. Shows the workflow steps the job is going through
 * and a history log. Both come straight from the booking document.
 */
export const StatusTimeline = ({ booking }) => {
  const steps = booking.steps?.length ? booking.steps : BOOKING.flow

  const history = [...(booking.history || [])].reverse()

  return (
    <div className="grid grid-2" style={{ alignItems: 'start' }}>
      <div className="card">
        <div className="row-between" style={{ marginBottom: 6 }}>
          <h3 className="card-title" style={{ marginBottom: 0 }}>Service progress</h3>
          <StatusBadge status={booking.status} />
        </div>

        {['pending', 'confirmed', 'in_progress', 'on_hold'].includes(booking.status) && (
          <p className="small muted" style={{ marginBottom: 14 }}>
            <span className="live-dot" /> Updating automatically
          </p>
        )}

        <div className="progress" style={{ marginBottom: 20 }}>
          <div
            className={`progress-bar ${booking.status === 'completed' ? 'ok' : ''}`}
            style={{ width: `${booking.progress || 0}%` }}
          />
        </div>

        <div className="timeline">
          {steps.map((step, index) => {
            const done = isDone(booking, step)
            const current = isCurrent(booking, step)
            const label = booking.steps?.length ? WORKFLOW_STEPS[step] || step : BOOKING.statuses[step]?.label || step

            return (
              <div key={step} className="tl-item">
                <div className={`tl-dot ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                  {done && '✓'}
                </div>
                <div className={`tl-title ${current ? '' : done ? '' : 'muted'}`}>
                  {index + 1}. {label}
                  {current && <span className="badge badge-cyan tiny" style={{ marginLeft: 8 }}>Now</span>}
                </div>
                {current && booking.currentStepLabel && (
                  <div className="tl-note">{booking.currentStepLabel}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Activity log</h3>

        {history.length === 0 ? (
          <p className="small muted">No activity yet.</p>
        ) : (
          <div className="timeline">
            {history.map((entry, index) => (
              <div key={`${entry.at}-${index}`} className="tl-item">
                <div className={`tl-dot ${index === 0 ? 'current' : 'done'}`} />
                <div className="tl-title">
                  {BOOKING.statuses[entry.status]?.label || entry.status}
                </div>
                {entry.note && <div className="tl-note">{entry.note}</div>}
                <div className="tl-meta">
                  {formatDateTime(entry.at)} · {timeAgo(entry.at)}
                  {entry.changedByRole === 'station' && ' · by station'}
                  {entry.changedByRole === 'customer' && ' · by customer'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatusTimeline