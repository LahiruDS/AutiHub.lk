const TOKEN_KEY = 'autocare_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

/**
 * Base URL. Empty string means "same origin", which is what we want on Vercel
 * because the API lives on the same deployment. For a separate API host, set
 * VITE_API_URL in .env and it will be used instead.
 */
export const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api'

const buildQuery = (params = {}) => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.append(key, value)
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

const parseBody = async (response) => {
  const type = response.headers.get('content-type') || ''
  if (type.includes('application/json')) return response.json()
  return {}
}

const request = async (method, path, { body, params, signal } = {}) => {
  const token = getToken()

  const response = await fetch(`${API_BASE}${path}${buildQuery(params)}`, {
    method,
    signal,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  })

  const payload = await parseBody(response)

  if (response.status === 401 && token) {
    clearToken()
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login?expired=1'
    }
  }

  if (!response.ok) {
    const error = new Error(payload.message || 'Something went wrong. Please try again.')
    error.status = response.status
    error.fieldErrors = payload.errors || null
    throw error
  }

  return payload
}

export const api = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options) => request('POST', path, { ...options, body }),
  patch: (path, body, options) => request('PATCH', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options)
}

/** Turns an ApiError into { field: message } for inline form errors. */
export const fieldErrorsOf = (error) =>
  (error?.fieldErrors || []).reduce((acc, item) => {
    if (item.field) acc[item.field] = item.message
    return acc
  }, {})

export default api