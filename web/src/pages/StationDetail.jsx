import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { Spinner } from '../components/Loader.jsx'
import { Stars } from '../components/StationCard.jsx'
import { formatMoney, formatDate, SERVICE_CATEGORIES } from '../config/constants.js'
import { useAuth } from '../context/AuthContext.jsx'

const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const StationDetail = () => {
  const { idOrSlug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.get(`/stations/${idOrSlug}`))
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [idOrSlug])

  useEffect(() => {
    load()
  }, [load])

  const book = () => {
    if (!user) return navigate('/login', { state: { from: `/stations/${idOrSlug}` } })
    navigate(`/book/${idOrSlug}`)
  }

  if (loading) return <Spinner label="Loading station..." />
  if (error) {
    return (
      <div className="container page">
        <div className="alert alert-error">{error}</div>
        <Link to="/stations" className="btn btn-outline">Back to stations</Link>
      </div>
    )
  }

  const { station, reviews, ratingBreakdown } = data
  const grouped = station.services.reduce((acc, service) => {
    (acc[service.category] ||= []).push(service)
    return acc
  }, {})

  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link to="/stations">Stations</Link>
        <span>/</span>
        <span>{station.name}</span>
      </div>

      <div className="split">
        <div className="stack">
          <div className="card">
            <div className="row-between" style={{ alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '1.7rem' }}>{station.name}</h1>
                <p className="muted small" style={{ marginTop: 4 }}>
                  {[station.address?.line1, station.address?.city, station.address?.district].filter(Boolean).join(', ')}
                </p>
              </div>
              {station.rating?.count > 0 && (
                <span className="badge badge-amber">★ {station.rating.average} ({station.rating.count})</span>
              )}
            </div>

            {station.description && <p style={{ marginTop: 16 }}>{station.description}</p>}

            <div className="row" style={{ marginTop: 18, gap: 20 }}>
              <a href={`tel:${station.phone}`} className="small">📞 {station.phone}</a>
              <a href={`mailto:${station.email}`} className="small">✉️ {station.email}</a>
            </div>

            <div className="row" style={{ marginTop: 14, gap: 8 }}>
              <span className="badge">{station.bayCount} service bays</span>
              <span className="badge">{station.slotMinutes} min slots</span>
              {station.images?.length > 0 && <span className="badge">{station.images.length} photos</span>}
            </div>

            <button type="button" className="btn btn-lg btn-block" style={{ marginTop: 22 }} onClick={book}>
              Book a service here
            </button>
          </div>

          <div className="card">
            <h3 className="card-title">Working hours</h3>
            <div className="stack" style={{ gap: 6 }}>
              {(station.workingHours || []).length === 0 && (
                <p className="small muted">Hours not published.</p>
              )}
              {(station.workingHours || [])
                .slice()
                .sort((a, b) => a.day - b.day)
                .map((rule) => (
                  <div key={rule.day} className="row-between small">
                    <span>{WEEKDAY[rule.day]}</span>
                    <span className={rule.isClosed ? 'muted' : 'bold'}>
                      {rule.isClosed ? 'Closed' : `${rule.open} - ${rule.close}`}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="row-between" style={{ marginBottom: 14 }}>
              <h3 className="card-title" style={{ marginBottom: 0 }}>Services & pricing</h3>
              <span className="count-pill">{station.services.length}</span>
            </div>

            {station.services.length === 0 ? (
              <p className="small muted">No services listed yet.</p>
            ) : (
              Object.entries(grouped).map(([category, services]) => (
                <div key={category} style={{ marginBottom: 18 }}>
                  <p className="tiny bold muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    {SERVICE_CATEGORIES[category] || category}
                  </p>
                  <div className="stack" style={{ gap: 10 }}>
                    {services.map((service) => (
                      <div key={service.id} className="row-between" style={{ gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div className="bold">{service.name}</div>
                          {service.description && <div className="small muted">{service.description}</div>}
                          <div className="tiny muted">~{service.durationMinutes} min</div>
                        </div>
                        <div className="price-tag nowrap">{formatMoney(service.price)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <div className="row-between" style={{ marginBottom: 14 }}>
              <h3 className="card-title" style={{ marginBottom: 0 }}>Customer reviews</h3>
              {station.rating?.count > 0 && <Stars value={station.rating.average} count={station.rating.count} />}
            </div>

            {station.rating?.count > 0 && (
              <div className="stack" style={{ gap: 4, marginBottom: 18 }}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingBreakdown?.[star] || 0
                  const percent = station.rating.count ? Math.round((count / station.rating.count) * 100) : 0
                  return (
                    <div key={star} className="row" style={{ gap: 10 }}>
                      <span className="small muted nowrap" style={{ width: 30 }}>{star} ★</span>
                      <div className="progress" style={{ flex: 1, height: 7 }}>
                        <div className="progress-bar" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="tiny muted nowrap" style={{ width: 28 }}>{count}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {reviews.length === 0 ? (
              <p className="small muted">No reviews yet. Be the first after your next service.</p>
            ) : (
              <div className="stack">
                {reviews.map((review) => (
                  <div key={review.id} style={{ paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>
                    <div className="row-between">
                      <span className="bold small">{review.customer?.name || 'Customer'}</span>
                      <span className="stars small">{'★'.repeat(review.rating)}</span>
                    </div>
                    {review.title && <div className="small bold" style={{ marginTop: 4 }}>{review.title}</div>}
                    {review.comment && <p className="small muted">{review.comment}</p>}
                    {review.stationReply && (
                      <div className="alert alert-info" style={{ marginTop: 8, marginBottom: 0, fontSize: '0.82rem' }}>
                        <b>Station reply:</b> {review.stationReply}
                      </div>
                    )}
                    <div className="tiny muted" style={{ marginTop: 5 }}>{formatDate(review.createdAt?.slice(0, 10))}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StationDetail