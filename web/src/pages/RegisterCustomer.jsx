import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { fieldErrorsOf } from '../lib/api.js'

const EMPTY = { name: '', email: '', phone: '', password: '', confirm: '' }

export const RegisterCustomer = () => {
  const { registerCustomer } = useAuth()
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
      const user = await registerCustomer({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password
      })
      toast.success('Account created. Welcome to AutoCare!')
      navigate('/stations', { replace: true })
      return user
    } catch (error) {
      setErrors(fieldErrorsOf(error))
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="card">
          <div className="center" style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: '1.6rem' }}>Create your account</h1>
            <p className="muted small">Book service, keep your cars and track jobs live</p>
          </div>

          {formError && <div className="alert alert-error">{formError}</div>}

          <form onSubmit={submit} noValidate>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="Nimal Perera"
                value={form.name}
                onChange={update('name')}
                autoComplete="name"
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={update('email')}
                  autoComplete="email"
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  className={`input ${errors.phone ? 'input-error' : ''}`}
                  placeholder="077 123 4567"
                  value={form.phone}
                  onChange={update('phone')}
                  autoComplete="tel"
                />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>
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
                  autoComplete="new-password"
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="field">
                <label htmlFor="confirm">Confirm password</label>
                <input
                  id="confirm"
                  type="password"
                  className={`input ${errors.confirm ? 'input-error' : ''}`}
                  placeholder="Repeat password"
                  value={form.confirm}
                  onChange={update('confirm')}
                  autoComplete="new-password"
                />
                {errors.confirm && <span className="error-text">{errors.confirm}</span>}
              </div>
            </div>

            <button type="submit" className="btn btn-block btn-lg" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="center small muted" style={{ marginTop: 18 }}>
            Already registered? <Link to="/login">Log in</Link>
          </p>
          <p className="center small muted">
            Service station owner? <Link to="/register/station">Register your station</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterCustomer