import { BOOKING } from '../config/constants.js'

export const StatusBadge = ({ status, small = false }) => {
  const meta = BOOKING.statuses[status] || { label: status, tone: '' }
  const tone = meta.tone ? `badge-${meta.tone}` : ''

  return (
    <span className={`badge ${tone} badge-dot ${small ? 'tiny' : ''}`}>
      {meta.label}
    </span>
  )
}

export default StatusBadge