export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
}

export const errorHandler = (error, req, res, _next) => {
  let status = error.statusCode || 500
  let message = error.message || 'Something went wrong'
  let errors = error.errors

  if (error.name === 'ValidationError') {
    status = 422
    message = 'Please check the highlighted fields'
    errors = Object.values(error.errors).map((item) => ({ field: item.path, message: item.message }))
  }

  if (error.name === 'CastError') {
    status = 400
    message = `Invalid ${error.path}: ${error.value}`
  }

  if (error.code === 11000) {
    status = 409
    const field = Object.keys(error.keyValue || { field: '' })[0]
    const readable = {
      email: 'An account with this email already exists',
      slug: 'This station name is already taken',
      registrationNumber: 'This vehicle is already in your garage',
      booking: 'You have already reviewed this booking'
    }
    message = readable[field] || 'This record already exists'
  }

  if (status >= 500) {
    console.error('[error]', error)
  }

  res.status(status).json({ message, errors })
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

export class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message)
    this.statusCode = statusCode
    this.errors = errors
  }
}