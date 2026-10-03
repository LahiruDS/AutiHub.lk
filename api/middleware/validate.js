/**
 * Turns a Mongoose validation error into a per-field shape the frontend can render inline.
 * Add new fields here when you add a new rule, no other file needs to change.
 */

const FIELDS = {
  registerCustomer: ['name', 'email', 'phone', 'password'],
  registerStation: ['name', 'email', 'phone', 'password', 'address', 'city'],
  login: ['email', 'password'],
  vehicle: ['make', 'model', 'registrationNumber'],
  service: ['name', 'price'],
  booking: ['stationId', 'date', 'slotStart', 'slotEnd'],
  review: ['rating']
}

const labelFor = (field) => {
    const map = {
      stationId: 'service station',
      registrationNumber: 'registration number',
      phone: 'phone number',
      city: 'city',
      slotStart: 'time slot',
      slotEnd: 'time slot'
    }
    return map[field] || field
  }

export const pickFields = (source, keys) =>
  keys.reduce((acc, key) => {
    if (source?.[key] !== undefined) acc[key] = source[key]
    return acc
  }, {})

export const validate = (form) => (req, res, next) => {
  const fields = FIELDS[form] || []
  const errors = {}

  for (const field of fields) {
    const value = req.body[field]

    if (value === undefined || value === null || value === '') {
      errors[field] = `${labelFor(field)} is required`
      continue
    }

    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) {
        errors[field] = `${labelFor(field)} is required`
      } else if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
        errors[field] = 'Enter a valid email address'
      } else if (field === 'password' && trimmed.length < 6) {
        errors[field] = 'Password must be at least 6 characters'
      } else if (field === 'phone' && !/^[0-9+\-\s()]{7,20}$/.test(trimmed)) {
        errors[field] = 'Enter a valid phone number'
      } else if (field === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        errors[field] = 'Use the date format YYYY-MM-DD'
      } else if (field === 'rating') {
        const rating = Number(trimmed)
        if (Number.isNaN(rating) || rating < 1 || rating > 5) {
          errors[field] = 'Rating must be between 1 and 5'
        }
      }
    }

    if (field === 'price' && (Number(value) < 0 || Number.isNaN(Number(value)))) {
      errors[field] = 'Enter a valid price'
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(422).json({
      message: 'Please fix the highlighted fields',
      errors: Object.entries(errors).map(([field, message]) => ({ field, message }))
    })
  }

  return next()
}