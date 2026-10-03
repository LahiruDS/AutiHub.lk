import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { fieldErrorsOf } from '../lib/api.js'

export const Login = () => {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [form, setForm] = useState({ email: '', password: '' })
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
    setSubmitting(true)
    setFormError('')

    try {
      const user = await login(form)
      toast.success(`Welcome back, ${user.name}`)
      navigate(user.role === 'station' ? '/station/dashboard' : '/bookings', { replace: true })
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
          <div className="center" style={{ marginBottom: 22 }}>
            <h1 style={{ fontSize: '1.6rem' }}>Welcome back</h1>
            <p className="muted small">Log in to book and track your car service</p>
          </div>

          {params.get('expired') && (
            <div className="alert alert-warn">Your session expired. Please log in again.</div>
          )}
          {formError && <div className="alert alert-error">{formError}</div>}

          <form onSubmit={submit} noValidate>
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
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={update('password')}
                autoComplete="current-password"
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <button type="submit" className="btn btn-block btn-lg" disabled={submitting}>
              {submitting ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <p className="center small muted" style={{ marginTop: 20 }}>
            New to AutoCare? <Link to="/register">Create a customer account</Link>
          </p>
          <p className="center small muted">
            Own a service station? <Link to="/register/station">Register your station</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login