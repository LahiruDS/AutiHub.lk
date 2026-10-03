import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, fieldErrorsOf } from '../lib/api.js'
import { EmptyState } from '../components/Loader.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { VEHICLE, formatDate, formatMoney } from '../config/constants.js'

const EMPTY = { make: '', model: '', year: '', registrationNumber: '', fuelType: 'petrol', transmission: 'manual', notes: '' }

export const MyVehicles = () => {
  const toast = useToast()

  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/vehicles')
      setVehicles(data.vehicles || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    try {
      await api.post('/vehicles', { ...form, year: form.year ? Number(form.year) : undefined })
      toast.success('Vehicle added to your garage')
      setForm(EMPTY)
      setOpen(false)
      load()
    } catch (err) {
      setErrors(fieldErrorsOf(err))
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const makeDefault = async (id) => {
    try {
      await api.patch(`/vehicles/${id}/default`)
      toast.success('Default vehicle updated')
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const remove = async (vehicle) => {
    if (!window.confirm(`Remove ${vehicle.make} ${vehicle.model} from your garage?`)) return
    try {
      await api.delete(`/vehicles/${vehicle.id}`)
      toast.success('Vehicle removed')
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const openHistory = async (id) => {
    try {
      setHistory(await api.get(`/vehicles/${id}/history`))
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="container page">
      <div className="page-head row-between">
        <div>
          <h1>My garage</h1>
          <p>Save your vehicles once and book any of them in seconds.</p>
        </div>
        <button type="button" className="btn" onClick={() => setOpen((value) => !value)}>
          {open ? 'Close' : '+ Add vehicle'}
        </button>
      </div>

      {open && (
        <div className="card" style={{ marginBottom: 22, borderColor: 'var(--brand)' }}>
          <h3 className="card-title">Add a vehicle</h3>
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="make">Make</label>
                <input id="make" className={`input ${errors.make ? 'input-error' : ''}`} placeholder="Toyota" value={form.make} onChange={update('make')} />
                {errors.make && <span className="error-text">{errors.make}</span>}
              </div>

              <div className="field">
                <label htmlFor="model">Model</label>
                <input id="model" className={`input ${errors.model ? 'input-error' : ''}`} placeholder="Axio" value={form.model} onChange={update('model')} />
                {errors.model && <span className="error-text">{errors.model}</span>}
              </div>

              <div className="field">
                <label htmlFor="registrationNumber">Registration number</label>
                <input
                  id="registrationNumber"
                  className={`input ${errors.registrationNumber ? 'input-error' : ''}`}
                  placeholder="WP-CAB-1234"
                  value={form.registrationNumber}
                  onChange={update('registrationNumber')}
                />
                {errors.registrationNumber && <span className="error-text">{errors.registrationNumber}</span>}
              </div>

              <div className="field">
                <label htmlFor="year">Year</label>
                <input id="year" type="number" className="input" placeholder="2019" value={form.year} onChange={update('year')} />
              </div>

              <div className="field">
                <label htmlFor="fuelType">Fuel type</label>
                <select id="fuelType" className="select" value={form.fuelType} onChange={update('fuelType')}>
                  {Object.entries(VEHICLE.fuelTypes).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="transmission">Transmission</label>
                <select id="transmission" className="select" value={form.transmission} onChange={update('transmission')}>
                  {Object.entries(VEHICLE.transmissions).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save vehicle'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="skeleton" style={{ height: 165 }} />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🚙"
            title="Your garage is empty"
            message="Add your car so booking takes just two clicks next time."
            action={<button type="button" className="btn" onClick={() => setOpen(true)}>Add your first vehicle</button>}
          />
        </div>
      ) : (
        <div className="grid grid-3">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="card">
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.08rem' }}>
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <p className="small muted">
                    {vehicle.year ? `${vehicle.year} · ` : ''}{VEHICLE.fuelTypes[vehicle.fuelType]} · {VEHICLE.transmissions[vehicle.transmission]}
                  </p>
                </div>
                {vehicle.isDefault && <span className="badge badge-blue">Default</span>}
              </div>

              <p className="bold" style={{ marginTop: 12, letterSpacing: '0.03em' }}>{vehicle.registrationNumber}</p>

              <div className="small muted" style={{ marginTop: 8 }}>
                {vehicle.bookingCount || 0} booking(s)
                {vehicle.lastServiceDate && ` · last service ${formatDate(vehicle.lastServiceDate.slice(0, 10))}`}
              </div>

              <div className="row" style={{ marginTop: 16, gap: 7 }}>
                <Link to="/stations" className="btn btn-sm">Book service</Link>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => openHistory(vehicle.id)}>
                  History
                </button>
                {!vehicle.isDefault && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => makeDefault(vehicle.id)}>
                    Set default
                  </button>
                )}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(vehicle)} style={{ color: 'var(--danger)' }}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {history && (
        <div className="modal-backdrop" onClick={() => setHistory(null)}>
          <div className="modal modal-lg" onClick={(event) => event.stopPropagation()}>
            <div className="row-between" style={{ marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>{history.vehicle.make} {history.vehicle.model}</h3>
                <p className="small muted">{history.vehicle.registrationNumber}</p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHistory(null)}>Close</button>
            </div>

            <div className="alert alert-info">
              Total spent on services: <b>{formatMoney(history.totalSpent)}</b>
            </div>

            {history.bookings.length === 0 ? (
              <p className="small muted">No bookings for this vehicle yet.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Date</th><th>Station</th><th>Status</th><th className="right">Total</th></tr>
                  </thead>
                  <tbody>
                    {history.bookings.map((booking) => (
                      <tr key={booking._id}>
                        <td className="nowrap" data-label="Date">{formatDate(booking.date)}</td>
                        <td data-label="Station">{booking.station?.name}</td>
                        <td data-label="Status"><span className="badge">{booking.status}</span></td>
                        <td className="right bold" data-label="Total">{formatMoney(booking.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MyVehicles