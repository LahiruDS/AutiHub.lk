import { useCallback, useEffect, useState } from 'react'
import { api, fieldErrorsOf } from '../../lib/api.js'
import { EmptyState } from '../../components/Loader.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatMoney, SERVICE_CATEGORIES, WORKFLOW_STEPS } from '../../config/constants.js'

const EMPTY = {
  name: '',
  description: '',
  category: 'routine',
  price: '',
  durationMinutes: 60,
  steps: []
}

export const StationServices = () => {
  const toast = useToast()
  const { station } = useAuth()

  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!station?._id) return setLoading(false)

    setLoading(true)
    try {
      const data = await api.get('/services', { params: { station: station._id } })
      setServices(data.services || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [station, toast])

  useEffect(() => {
    load()
  }, [load])

  const startCreate = () => {
    setEditing('new')
    setForm(EMPTY)
    setErrors({})
  }

  const startEdit = (service) => {
    setEditing(service.id)
    setForm({
      name: service.name,
      description: service.description || '',
      category: service.category,
      price: service.price,
      durationMinutes: service.durationMinutes,
      steps: service.steps || []
    })
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleStep = (key) => {
    setForm((current) => ({
      ...current,
      steps: current.steps.includes(key)
        ? current.steps.filter((item) => item !== key)
        : [...current.steps, key]
    }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setErrors({})

    try {
      const payload = { ...form, price: Number(form.price), durationMinutes: Number(form.durationMinutes) }

      if (editing === 'new') await api.post('/services', payload)
      else await api.patch(`/services/${editing}`, payload)

      toast.success(editing === 'new' ? 'Service added' : 'Service updated')
      setEditing(null)
      setForm(EMPTY)
      load()
    } catch (err) {
      setErrors(fieldErrorsOf(err))
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (service) => {
    if (!window.confirm(`Remove "${service.name}" from your service list?`)) return
    try {
      await api.delete(`/services/${service.id}`)
      toast.success('Service removed')
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="container page">
      <div className="page-head row-between">
        <div>
          <h1>Services & pricing</h1>
          <p>What customers can book, how long it takes, and which workflow steps it triggers.</p>
        </div>
        <button type="button" className="btn" onClick={startCreate}>+ Add service</button>
      </div>

      {editing && (
        <div className="card" style={{ marginBottom: 22, borderColor: 'var(--brand)' }}>
          <div className="row-between" style={{ marginBottom: 14 }}>
            <h3 className="card-title" style={{ marginBottom: 0 }}>
              {editing === 'new' ? 'New service' : 'Edit service'}
            </h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Cancel</button>
          </div>

          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="name">Service name</label>
                <input
                  id="name"
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  placeholder="Regular Service (Oil + Filter)"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="field">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  className="select"
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                >
                  {Object.entries(SERVICE_CATEGORIES).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="price">Price</label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="50"
                  className={`input ${errors.price ? 'input-error' : ''}`}
                  placeholder="9500"
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                />
                {errors.price && <span className="error-text">{errors.price}</span>}
              </div>

              <div className="field">
                <label htmlFor="durationMinutes">Duration (minutes)</label>
                <input
                  id="durationMinutes"
                  type="number"
                  min="15"
                  step="15"
                  className="input"
                  value={form.durationMinutes}
                  onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))}
                />
              </div>

              <div className="field span-2">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  className="textarea"
                  placeholder="What is included, brands you cover, warranty..."
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                />
              </div>
            </div>

            <div className="field">
              <label>Workflow steps for this service</label>
              <p className="hint" style={{ marginBottom: 8 }}>
                The customer follows these live while you work on their car.
              </p>
              <div className="row" style={{ gap: 7 }}>
                {Object.entries(WORKFLOW_STEPS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`btn btn-sm ${form.steps.includes(key) ? '' : 'btn-outline'}`}
                    onClick={() => toggleStep(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving...' : editing === 'new' ? 'Add service' : 'Save changes'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="skeleton" style={{ height: 220 }} />
      ) : services.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🔧"
            title="No services yet"
            message="Add the services you offer so customers can book them."
            action={<button type="button" className="btn" onClick={startCreate}>Add your first service</button>}
          />
        </div>
      ) : (
        <div className="table-wrap card card-flush">
          <table className="table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Category</th>
                <th>Duration</th>
                <th>Steps</th>
                <th className="right">Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td data-label="Service">
                    <div className="bold small">{service.name}</div>
                    {service.description && <div className="tiny muted">{service.description}</div>}
                  </td>
                  <td className="small muted" data-label="Category">{SERVICE_CATEGORIES[service.category] || service.category}</td>
                  <td className="small nowrap" data-label="Duration">{service.durationMinutes} min</td>
                  <td className="small muted" data-label="Steps">
                    {service.steps?.length
                      ? service.steps.map((step) => WORKFLOW_STEPS[step] || step).join(' → ')
                      : '-'}
                  </td>
                  <td className="right bold nowrap" data-label="Price">{formatMoney(service.price)}</td>
                  <td className="right nowrap">
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => startEdit(service)}>Edit</button>{' '}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => remove(service)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default StationServices