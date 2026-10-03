import { Link } from 'react-router-dom'
import { formatMoney } from '../config/constants.js'

const Stars = ({ value = 0, count }) => (
  <span className="row" style={{ gap: 6 }}>
    <span className="stars">{'★'.repeat(Math.round(value))}<span style={{ color: 'var(--line)' }}>{'★'.repeat(5 - Math.round(value))}</span></span>
    <span className="small muted">
      {Number(value).toFixed(1)}
      {count !== undefined && ` (${count})`}
    </span>
  </span>
)

export const StationCard = ({ station }) => (
  <Link to={`/stations/${station.slug || station.id}`} className="card card-hover">
    <div className="row-between" style={{ alignItems: 'flex-start' }}>
      <div>
        <h3 style={{ fontSize: '1.08rem' }}>{station.name}</h3>
        <p className="small muted">
          {[station.address?.city, station.address?.district].filter(Boolean).join(', ') || 'Location on request'}
        </p>
      </div>
      {station.rating?.count > 0 && <span className="badge badge-amber">★ {station.rating.average}</span>}
    </div>

    {station.description && (
      <p className="small muted" style={{ marginTop: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {station.description}
      </p>
    )}

    <div className="spacer" />

    <div className="row-between" style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
      <div className="small muted">
        {station.serviceCount ?? 0} services · {station.bayCount || 1} bays
      </div>
      {station.startingPrice != null && (
        <div className="right">
          <div className="tiny muted">from</div>
          <div className="bold" style={{ color: 'var(--brand-dark)' }}>{formatMoney(station.startingPrice)}</div>
        </div>
      )}
    </div>
  </Link>
)

export { Stars }
export default StationCard