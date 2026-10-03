import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api.js'
import StatusBadge from '../../components/StatusBadge.jsx'
import { CardSkeleton, EmptyState } from '../../components/Loader.jsx'
import { STATION_STATUS_TABS, formatMoney, formatDate } from '../../config/constants.js'

export const StationBookings = () => {
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState(params.get('status') || 'all')
  const [date, setDate] = useState(params.get('date') || '')
  const [data, setData] = useState({ bookings: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.get('/bookings/station', { params: { status, date, limit: 50 } }))
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [status, date])

  useEffect(() => {
    load()
  }, [load])

  const changeStatus = (value) => {
    setStatus(value)
    const next = new URLSearchParams(params)
    if (value === 'all') next.delete('status')
    else next.set('status', value)
    setParams(next, { replace: true })
  }

  const changeDate = (value) => {
    setDate(value)
    const next = new URLSearchParams(params)
    if (value) next.set('date', value)
    else next.delete('date')
    setParams(next, { replace: true })
  }

  return (
    <div className="container page">
      <div className="page-head row-between">
        <div>
          <h1>Bookings</h1>
          <p>Confirm requests and update each job so customers see it live.</p>
        </div>
        <input
          type="date"
          className="input"
          style={{ width: 170 }}
          value={date}
          onChange={(event) => changeDate(event.target.value)}
        />
      </div>

      <div className="tabs">
        {STATION_STATUS_TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`tab ${status === item.value ? 'active' : ''}`}
            onClick={() => changeStatus(item.value)}
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
            icon="📋"
            title="No bookings here"
            message={date ? 'No bookings on this date.' : 'Bookings will appear here as customers book slots.'}
            action={date ? <button type="button" className="btn btn-outline" onClick={() => changeDate('')}>Clear date filter</button> : null}
          />
        </div>
      ) : (
        <>
          <p className="small muted" style={{ marginBottom: 12 }}>
            <span className="count-pill">{data.total}</span> booking(s)
          </p>

          <div className="table-wrap card card-flush">
            <table className="table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Date & time</th>
                  <th>Vehicle</th>
                  <th>Customer</th>
                  <th>Services</th>
                  <th className="right">Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="tiny bold nowrap" data-label="Ref">{booking.reference}</td>
                    <td className="nowrap" data-label="Date & time">
                      <div className="small bold">{formatDate(booking.date)}</div>
                      <div className="tiny muted">{booking.slotStart} - {booking.slotEnd}</div>
                    </td>
                    <td className="small" data-label="Vehicle">
                      {booking.vehicle ? (
                        <>
                          <div className="bold">{booking.vehicle.make} {booking.vehicle.model}</div>
                          <div className="tiny muted">{booking.vehicle.registrationNumber}</div>
                        </>
                      ) : (
                        <span className="muted">-</span>
                      )}
                    </td>
                    <td className="small" data-label="Customer">
                      <div className="bold">{booking.customer?.name}</div>
                      <div className="tiny muted">{booking.customer?.phone}</div>
                    </td>
                    <td className="small muted" data-label="Services">{booking.items.length}</td>
                    <td className="right bold nowrap" data-label="Total">{formatMoney(booking.totalPrice)}</td>
                    <td data-label="Status"><StatusBadge status={booking.status} /></td>
                    <td className="right">
                      <Link to={`/station/bookings/${booking.id}`} className="btn btn-outline btn-sm nowrap">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default StationBookings