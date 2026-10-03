import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { fieldErrorsOf } from '../lib/api.js'

const EMPTY = {
  stationName: '',
  ownerName: '',
  email: '',
  phone: '',
  password: '',
  confirm: '',
  address: '',
  city: '',
  district: '',
  description: ''
}

export const RegisterStation = () => {
  const { registerStation } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setFormError('')
  }

  const submit = async (event) => {
    event.preventDefault()

    if (form.password !== form.confirm) {
      setErrors({ confirm: 'Passwords do not match' })
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      const station = await registerStation({
        name: form.stationName,
        ownerName: form.ownerName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        address: form.address,
        city: form.city,
        district: form.district,
        description: form.description
      })
      toast.success(`${station.name} is live. Add your services and start taking bookings.`)
      navigate('/station/services', { replace: true })
    } catch (error) {
      setErrors(fieldErrorsOf(error))
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card auth-card-lg">
        <div className="card">
          <div className="center" style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: '1.6rem' }}>Register your service station</h1>
            <p className="muted small">Free to join. We add a starter service list so you can start taking bookings right away.</p>
          </div>

          {formError && <div className="alert alert-error">{formError}</div>}

          <form onSubmit={submit} noValidate>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="stationName">Station name</label>
                <input
                  id="stationName"
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  placeholder="City Auto Care"
                  value={form.stationName}
                  onChange={update('stationName')}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="field">
                <label htmlFor="ownerName">Owner / manager name</label>
                <input
                  id="ownerName"
                  className="input"
                  placeholder="Kamal Fernando"
                  value={form.ownerName}
                  onChange={update('ownerName')}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="email">Business email</label>
                <input
                  id="email"
                  type="email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="service@station.lk"
                  value={form.email}
                  onChange={update('email')}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  className={`input ${errors.phone ? 'input-error' : ''}`}
                  placeholder="011 234 5678"
                  value={form.phone}
                  onChange={update('phone')}
                />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  className="input"
                  placeholder="No. 42, Main Road"
                  value={form.address}
                  onChange={update('address')}
                />
              </div>

              <div className="field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  className={`input ${errors.city ? 'input-error' : ''}`}
                  placeholder="Colombo"
                  value={form.city}
                  onChange={update('city')}
                />
                {errors.city && <span className="error-text">{errors.city}</span>}
              </div>

              <div className="field">
                <label htmlFor="district">District</label>
                <input
                  id="district"
                  className="input"
                  placeholder="Colombo"
                  value={form.district}
                  onChange={update('district')}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="description">About your station</label>
              <textarea
                id="description"
                className="textarea"
                placeholder="Tell customers what you specialise in, brands you work with, warranty you offer..."
                value={form.description}
                onChange={update('description')}
              />
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={update('password')}
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="field">
                <label htmlFor="confirm">Confirm password</label>
                <input
                  id="confirm"
                  type="password"
                  className={`input ${errors.confirm ? 'input-error' : ''}`}
                  value={form.confirm}
                  onChange={update('confirm')}
                />
                {errors.confirm && <span className="error-text">{errors.confirm}</span>}
              </div>
            </div>

            <button type="submit" className="btn btn-block btn-lg" disabled={submitting}>
              {submitting ? 'Setting up your station...' : 'Register station'}
            </button>
          </form>

          <p className="center small muted" style={{ marginTop: 18 }}>
            Already registered? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterStation