import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Stars } from '../../components/StationCard.jsx'

const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const StationProfile = () => {
  const { station, user, refresh } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })

  useEffect(() => {
    if (!station) return
    setForm({
      name: station.name || '',
      description: station.description || '',
      phone: station.phone || '',
      email: station.email || '',
      address: station.address?.line1 || '',
      city: station.address?.city || '',
      district: station.address?.district || '',
      bayCount: station.bayCount || 2,
      slotMinutes: station.slotMinutes || 60,
      workingHours: station.workingHours?.length ? station.workingHours : buildDefaultHours()
    })
  }, [station])

  if (!form) return <div className="container page"><div className="skeleton" style={{ height: 300 }} /></div>

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const updateHour = (day, field, value) => {
    setForm((current) => ({
      ...current,
      workingHours: current.workingHours.map((rule) => (rule.day === day ? { ...rule, [field]: value } : rule))
    }))
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await api.patch('/stations/me', {
        name: form.name,
        description: form.description,
        phone: form.phone,
        bayCount: Number(form.bayCount),
        slotMinutes: Number(form.slotMinutes),
        workingHours: form.workingHours,
        address: {
          line1: form.address,
          city: form.city,
          district: form.district
        }
      })
      toast.success('Station profile updated')
      refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const savePassword = async (event) => {
    event.preventDefault()
    try {
      await api.post('/auth/change-password', passwords)
      toast.success('Password changed')
      setPasswords({ currentPassword: '', newPassword: '' })
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Station profile</h1>
        <p>This is what customers see on your public page.</p>
      </div>

      <div className="split">
        <form className="card" onSubmit={save}>
          <h3 className="card-title">Business details</h3>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="name">Station name</label>
              <input id="name" className="input" value={form.name} onChange={update('name')} />
            </div>

            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input id="phone" className="input" value={form.phone} onChange={update('phone')} />
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" className="input" value={form.email} onChange={update('email')} />
            </div>

            <div className="field">
              <label htmlFor="address">Address</label>
              <input id="address" className="input" value={form.address} onChange={update('address')} />
            </div>

            <div className="field">
              <label htmlFor="city">City</label>
              <input id="city" className="input" value={form.city} onChange={update('city')} />
            </div>

            <div className="field">
              <label htmlFor="district">District</label>
              <input id="district" className="input" value={form.district} onChange={update('district')} />
            </div>
          </div>

          <div className="field span-2">
            <label htmlFor="description">About your station</label>
            <textarea id="description" className="textarea" value={form.description} onChange={update('description')} />
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="bayCount">Number of service bays</label>
              <input id="bayCount" type="number" min="1" className="input" value={form.bayCount} onChange={update('bayCount')} />
              <span className="hint">How many cars you can handle at once.</span>
            </div>

            <div className="field">
              <label htmlFor="slotMinutes">Slot length (minutes)</label>
              <input id="slotMinutes" type="number" min="15" step="15" className="input" value={form.slotMinutes} onChange={update('slotMinutes')} />
              <span className="hint">Changes every bookable time slot instantly.</span>
            </div>
          </div>

          <h3 className="card-title" style={{ marginTop: 20 }}>Working hours</h3>
          <p className="small muted" style={{ marginBottom: 12 }}>
            Bookings can only be made inside these hours. Closed days are hidden from customers.
          </p>

          <div className="stack" style={{ gap: 8 }}>
            {form.workingHours
              .slice()
              .sort((a, b) => a.day - b.day)
              .map((rule) => (
                <div key={rule.day} className="row" style={{ gap: 10 }}>
                  <span className="small bold" style={{ width: 78 }}>{WEEKDAY[rule.day]}</span>
                  <input
                    type="time"
                    className="input"
                    style={{ width: 120 }}
                    value={rule.open}
                    disabled={rule.isClosed}
                    onChange={(event) => updateHour(rule.day, 'open', event.target.value)}
                  />
                  <span className="muted">to</span>
                  <input
                    type="time"
                    className="input"
                    style={{ width: 120 }}
                    value={rule.close}
                    disabled={rule.isClosed}
                    onChange={(event) => updateHour(rule.day, 'close', event.target.value)}
                  />
                  <label className="row small" style={{ gap: 6, marginLeft: 'auto', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={rule.isClosed}
                      onChange={(event) => updateHour(rule.day, 'isClosed', event.target.checked)}
                      style={{ accentColor: 'var(--brand)' }}
                    />
                    Closed
                  </label>
                </div>
              ))}
          </div>

          <button type="submit" className="btn" style={{ marginTop: 20 }} disabled={saving}>
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>

        <div className="stack">
          <div className="card">
            <h3 className="card-title">Public rating</h3>
            {station.rating?.count > 0 ? (
              <Stars value={station.rating.average} count={station.rating.count} />
            ) : (
              <p className="small muted">No reviews yet.</p>
            )}
          </div>

          <div className="card">
            <h3 className="card-title">Account</h3>
            <p className="small muted">{user?.name}</p>
            <p className="small muted">{user?.email}</p>

            <form onSubmit={savePassword} style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--line)' }}>
              <div className="field">
                <label htmlFor="currentPassword">Current password</label>
                <input
                  id="currentPassword"
                  type="password"
                  className="input"
                  value={passwords.currentPassword}
                  onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="newPassword">New password</label>
                <input
                  id="newPassword"
                  type="password"
                  className="input"
                  value={passwords.newPassword}
                  onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))}
                />
              </div>
              <button type="submit" className="btn btn-outline btn-sm">Change password</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

const buildDefaultHours = () =>
  [1, 2, 3, 4, 5, 6].map((day) => ({ day, open: '08:00', close: '18:00', isClosed: false }))

export default StationProfile