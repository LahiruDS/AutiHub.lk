import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import StationCard, { Stars } from '../components/StationCard.jsx'
import { CardSkeleton, EmptyState } from '../components/Loader.jsx'
import { SERVICE_CATEGORIES } from '../config/constants.js'

export const Stations = () => {
  const [filters, setFilters] = useState({ search: '', city: '', category: '', sort: 'rating' })
  const [data, setData] = useState({ stations: [], total: 0, pages: 1 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const payload = await api.get('/stations', {
        params: {
          search: filters.search,
          city: filters.city,
          service: filters.category,
          sort: filters.sort,
          page,
          limit: 12
        }
      })
      setData(payload)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    const timer = setTimeout(load, filters.search ? 350 : 0)
    return () => clearTimeout(timer)
  }, [load, filters.search])

  const update = (field) => (event) => {
    setFilters((current) => ({ ...current, [field]: event.target.value }))
    setPage(1)
  }

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Find a service station</h1>
        <p>Compare prices and ratings, then pick a time slot that works for you.</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="filters">
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="search">Search</label>
            <input
              id="search"
              className="input"
              placeholder="Station name, city or service"
              value={filters.search}
              onChange={update('search')}
            />
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="city">City</label>
            <input id="city" className="input" placeholder="Colombo" value={filters.city} onChange={update('city')} />
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="category">Service type</label>
            <select id="category" className="select" value={filters.category} onChange={update('category')}>
              <option value="">Any service</option>
              {Object.entries(SERVICE_CATEGORIES).map(([value, label]) => (
                <option key={value} value={label}>{label}</option>
              ))}
            </select>
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="sort">Sort by</label>
            <select id="sort" className="select" value={filters.sort} onChange={update('sort')}>
              <option value="rating">Top rated</option>
              <option value="name">Name (A-Z)</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <CardSkeleton count={6} />
      ) : data.stations.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🔍"
            title="No stations match your search"
            message="Try clearing the filters or searching for a different city."
            action={
              <button type="button" className="btn btn-outline" onClick={() => setFilters({ search: '', city: '', category: '', sort: 'rating' })}>
                Clear filters
              </button>
            }
          />
        </div>
      ) : (
        <>
          <p className="small muted" style={{ marginBottom: 14 }}>
            <span className="count-pill">{data.total}</span> station{data.total === 1 ? '' : 's'} available
          </p>

          <div className="grid grid-3">
            {data.stations.map((station) => <StationCard key={station.id} station={station} />)}
          </div>

          {data.pages > 1 && (
            <div className="row" style={{ justifyContent: 'center', marginTop: 30 }}>
              <button type="button" className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                Previous
              </button>
              <span className="small muted">Page {data.page} of {data.pages}</span>
              <button type="button" className="btn btn-outline btn-sm" disabled={page >= data.pages} onClick={() => setPage((value) => value + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export const StationsIntro = () => (
  <div className="center">
    <Stars />
    <p className="muted small">Ratings come from customers who completed a service.</p>
    <Link to="/register/station">Are you a station owner?</Link>
  </div>
)

export default Stations