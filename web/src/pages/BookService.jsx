import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, fieldErrorsOf } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { Spinner } from '../components/Loader.jsx'
import SlotPicker from '../components/SlotPicker.jsx'
import { Stepper } from '../components/Ui.jsx'
import { formatMoney, SERVICE_CATEGORIES, VEHICLE } from '../config/constants.js'

const STEPS = ['Services', 'Date & time', 'Your car', 'Confirm']

export const BookService = () => {
  const { idOrSlug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  const [station, setStation] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [step, setStep] = useState(0)

  const [serviceIds, setServiceIds] = useState([])
  const [slot, setSlot] = useState({ date: null, slotStart: null, slotEnd: null })
  const [vehicleId, setVehicleId] = useState('')
  const [note, setNote] = useState('')

  const [newVehicle, setNewVehicle] = useState({ make: '', model: '', registrationNumber: '', year: '', fuelType: 'petrol' })
  const [showNewVehicle, setShowNewVehicle] = useState(false)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await api.get(`/stations/${idOrSlug}`)
        if (cancelled) return
        setStation(data.station)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [idOrSlug])

  const loadVehicles = useCallback(async () => {
    try {
      const data = await api.get('/vehicles')
      setVehicles(data.vehicles || [])
      const preferred = data.vehicles?.find((vehicle) => vehicle.isDefault) || data.vehicles?.[0]
      if (preferred) setVehicleId(preferred.id)
      else setShowNewVehicle(true)
    } catch {
      setShowNewVehicle(true)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'customer') loadVehicles()
  }, [user, loadVehicles])

  const selectedServices = useMemo(
    () => (station?.services || []).filter((service) => serviceIds.includes(service.id)),
    [station, serviceIds]
  )

  const total = selectedServices.reduce((sum, service) => sum + service.price, 0)
  const duration = selectedServices.reduce((sum, service) => sum + (service.durationMinutes || 60), 0)

  const grouped = useMemo(
    () =>
      (station?.services || []).reduce((acc, service) => {
        (acc[service.category] ||= []).push(service)
        return acc
      }, {}),
    [station]
  )

  const toggleService = (id) => {
    setServiceIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )
  }

  const canGoNext = () => {
    if (step === 0) return serviceIds.length > 0
    if (step === 1) return Boolean(slot.date && slot.slotStart)
    if (step === 2) return Boolean(vehicleId)
    return true
  }

  const addVehicle = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const data = await api.post('/vehicles', {
        ...newVehicle,
        year: newVehicle.year ? Number(newVehicle.year) : undefined
      })
      await loadVehicles()
      setVehicleId(data.vehicle.id)
      setShowNewVehicle(false)
      setNewVehicle({ make: '', model: '', registrationNumber: '', year: '', fuelType: 'petrol' })
      toast.success(`${data.vehicle.make} ${data.vehicle.model} added to your garage`)
    } catch (err) {
      setErrors(fieldErrorsOf(err))
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const submit = async () => {
    setSubmitting(true)
    setErrors({})

    try {
      const data = await api.post('/bookings', {
        stationId: station.id,
        vehicleId,
        serviceIds,
        date: slot.date,
        slotStart: slot.slotStart,
        slotEnd: slot.slotEnd,
        customerNote: note
      })

      toast.success('Booking request sent!')
      navigate(`/bookings/${data.booking.id}`)
    } catch (err) {
      setErrors(fieldErrorsOf(err))
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner label="Loading station..." />

  if (error || !station) {
    return (
      <div className="container page">
        <div className="alert alert-error">{error || 'Station not found'}</div>
        <Link to="/stations" className="btn btn-outline">Back to stations</Link>
      </div>
    )
  }

  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link to="/stations">Stations</Link>
        <span>/</span>
        <Link to={`/stations/${station.slug || station.id}`}>{station.name}</Link>
        <span>/</span>
        <span>Book</span>
      </div>

      <div className="page-head">
        <h1>Book at {station.name}</h1>
        <p>Pick what you need, choose a slot, and we will handle the rest.</p>
      </div>

      <Stepper steps={STEPS} current={step} />

      <div className="split">
        <div className="card">
          {step === 0 && (
            <>
              <h3 className="card-title">1. What does your car need?</h3>

              {Object.entries(grouped).map(([category, services]) => (
                <div key={category} style={{ marginBottom: 20 }}>
                  <p className="tiny bold muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 9 }}>
                    {SERVICE_CATEGORIES[category] || category}
                  </p>
                  <div className="stack" style={{ gap: 9 }}>
                    {services.map((service) => (
                      <label key={service.id} className={`pick ${serviceIds.includes(service.id) ? 'selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={serviceIds.includes(service.id)}
                          onChange={() => toggleService(service.id)}
                        />
                        <div style={{ flex: 1 }}>
                          <div className="row-between">
                            <span className="bold">{service.name}</span>
                            <span className="bold nowrap">{formatMoney(service.price)}</span>
                          </div>
                          {service.description && <div className="small muted">{service.description}</div>}
                          <div className="tiny muted">Takes about {service.durationMinutes} minutes</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {step === 1 && (
            <>
              <h3 className="card-title">2. Pick a date and time</h3>
              <p className="small muted" style={{ marginBottom: 16 }}>
                Greyed out times are already taken or have passed. Everything you see here is genuinely available.
              </p>
              <SlotPicker stationId={station.id} value={slot} onChange={setSlot} />
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="card-title">3. Which car is this for?</h3>

              {vehicles.length > 0 && (
                <div className="stack" style={{ gap: 9, marginBottom: 20 }}>
                  {vehicles.map((vehicle) => (
                    <label key={vehicle.id} className={`pick ${vehicleId === vehicle.id ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="vehicle"
                        checked={vehicleId === vehicle.id}
                        onChange={() => setVehicleId(vehicle.id)}
                        style={{ borderRadius: '50%' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div className="row-between">
                          <span className="bold">{vehicle.make} {vehicle.model}</span>
                          <span className="badge">{vehicle.registrationNumber}</span>
                        </div>
                        <div className="tiny muted">
                          {vehicle.year ? `${vehicle.year} · ` : ''}{VEHICLE.fuelTypes[vehicle.fuelType]} · {VEHICLE.transmissions[vehicle.transmission]}
                          {vehicle.isDefault && ' · default'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {!showNewVehicle ? (
                <button type="button" className="btn btn-outline" onClick={() => setShowNewVehicle(true)}>
                  + Add another vehicle
                </button>
              ) : (
                <form onSubmit={addVehicle} style={{ borderTop: '1px solid var(--line)', paddingTop: 18 }}>
                  <h4 style={{ marginBottom: 12 }}>New vehicle</h4>

                  <div className="form-grid">
                    <div className="field">
                      <label>Make</label>
                      <input
                        className={`input ${errors.make ? 'input-error' : ''}`}
                        placeholder="Toyota"
                        value={newVehicle.make}
                        onChange={(event) => setNewVehicle((current) => ({ ...current, make: event.target.value }))}
                      />
                      {errors.make && <span className="error-text">{errors.make}</span>}
                    </div>

                    <div className="field">
                      <label>Model</label>
                      <input
                        className={`input ${errors.model ? 'input-error' : ''}`}
                        placeholder="Axio"
                        value={newVehicle.model}
                        onChange={(event) => setNewVehicle((current) => ({ ...current, model: event.target.value }))}
                      />
                      {errors.model && <span className="error-text">{errors.model}</span>}
                    </div>

                    <div className="field">
                      <label>Registration number</label>
                      <input
                        className={`input ${errors.registrationNumber ? 'input-error' : ''}`}
                        placeholder="WP-CAB-1234"
                        value={newVehicle.registrationNumber}
                        onChange={(event) => setNewVehicle((current) => ({ ...current, registrationNumber: event.target.value }))}
                      />
                      {errors.registrationNumber && <span className="error-text">{errors.registrationNumber}</span>}
                    </div>

                    <div className="field">
                      <label>Year</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="2019"
                        value={newVehicle.year}
                        onChange={(event) => setNewVehicle((current) => ({ ...current, year: event.target.value }))}
                      />
                    </div>

                    <div className="field">
                      <label>Fuel type</label>
                      <select
                        className="select"
                        value={newVehicle.fuelType}
                        onChange={(event) => setNewVehicle((current) => ({ ...current, fuelType: event.target.value }))}
                      >
                        {Object.entries(VEHICLE.fuelTypes).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <button type="submit" className="btn" disabled={submitting}>
                      {submitting ? 'Saving...' : 'Save vehicle'}
                    </button>
                    {vehicles.length > 0 && (
                      <button type="button" className="btn btn-ghost" onClick={() => setShowNewVehicle(false)}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}

              <div className="field" style={{ marginTop: 22 }}>
                <label htmlFor="note">Anything the station should know? (optional)</label>
                <textarea
                  id="note"
                  className="textarea"
                  placeholder="Making a noise from the front left wheel, AC not cooling properly..."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="card-title">4. Check and confirm</h3>

              <div className="stack">
                <div className="card" style={{ boxShadow: 'none' }}>
                  <p className="bold" style={{ marginBottom: 6 }}>{station.name}</p>
                  <p className="small muted">
                    {[station.address?.line1, station.address?.city].filter(Boolean).join(', ')}
                  </p>
                  <p className="small muted">{station.phone}</p>
                </div>

                <div className="card" style={{ boxShadow: 'none' }}>
                  <p className="bold" style={{ marginBottom: 8 }}>Services</p>
                  {selectedServices.map((service) => (
                    <div key={service.id} className="summary-row">
                      <span>{service.name}</span>
                      <span className="bold">{formatMoney(service.price)}</span>
                    </div>
                  ))}
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>{formatMoney(total)}</span>
                  </div>
                  <p className="tiny muted" style={{ marginTop: 8 }}>
                    Estimated work time: about {Math.round(duration / 60 * 10) / 10} hours
                  </p>
                </div>

                <div className="card" style={{ boxShadow: 'none' }}>
                  <p className="bold" style={{ marginBottom: 8 }}>Appointment</p>
                  <div className="summary-row">
                    <span className="muted">Date</span>
                    <span className="bold">{slot.date}</span>
                  </div>
                  <div className="summary-row">
                    <span className="muted">Time</span>
                    <span className="bold">{slot.slotStart} - {slot.slotEnd}</span>
                  </div>
                  <div className="summary-row">
                    <span className="muted">Vehicle</span>
                    <span className="bold">
                      {vehicles.find((vehicle) => vehicle.id === vehicleId)?.registrationNumber || '-'}
                    </span>
                  </div>
                  {note && (
                    <div style={{ marginTop: 10 }}>
                      <p className="tiny muted" style={{ marginBottom: 4 }}>Your note</p>
                      <p className="small">{note}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="alert alert-info" style={{ marginTop: 16, marginBottom: 0 }}>
                You will get an email and SMS as soon as the station confirms. You can cancel from your bookings page.
              </div>
            </>
          )}

          <div className="row-between" style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              disabled={step === 0}
            >
              ← Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                className="btn"
                onClick={() => setStep((value) => value + 1)}
                disabled={!canGoNext()}
              >
                Continue →
              </button>
            ) : (
              <button type="button" className="btn btn-ok btn-lg" onClick={submit} disabled={submitting}>
                {submitting ? 'Sending...' : `Confirm booking - ${formatMoney(total)}`}
              </button>
            )}
          </div>

          {step === 0 && serviceIds.length === 0 && (
            <p className="small muted right" style={{ marginTop: 8 }}>Select at least one service to continue.</p>
          )}
        </div>

        <div className="card sticky-side">
          <h3 className="card-title">Order summary</h3>

          {selectedServices.length === 0 ? (
            <p className="small muted">No services selected yet.</p>
          ) : (
            <>
              <div className="stack" style={{ gap: 8 }}>
                {selectedServices.map((service) => (
                  <div key={service.id} className="row-between small">
                    <span style={{ flex: 1, paddingRight: 8 }}>{service.name}</span>
                    <span className="bold nowrap">{formatMoney(service.price)}</span>
                  </div>
                ))}
              </div>

              <div className="summary-row total">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>

              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--line)' }} className="stack">
                {slot.date && (
                  <div className="row-between small">
                    <span className="muted">Date</span>
                    <span className="bold">{slot.date}</span>
                  </div>
                )}
                {slot.slotStart && (
                  <div className="row-between small">
                    <span className="muted">Time</span>
                    <span className="bold">{slot.slotStart} - {slot.slotEnd}</span>
                  </div>
                )}
                <div className="row-between small">
                  <span className="muted">Selected</span>
                  <span className="bold">{selectedServices.length} service(s)</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookService