import bcrypt from 'bcryptjs'
import { User } from '../models/User.js'
import { Station } from '../models/Station.js'
import { Service } from '../models/Service.js'
import { Booking } from '../models/Booking.js'
import Review from '../models/Review.js'
import Vehicle from '../models/Vehicle.js'
import Notification from '../models/Notification.js'
import { signToken } from '../middleware/auth.js'
import { ApiError, asyncHandler } from '../middleware/error.js'
import { notifyUser } from '../utils/notifier.js'
import { STEP_FLOW } from '../utils/steps.js'
import { getStepLabel } from '../utils/steps.js'

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const DEFAULT_SERVICES = [
  { name: 'Regular Service (Oil + Filter)', category: 'routine', price: 9500, durationMinutes: 90, steps: ['received', 'inspection', 'oil_filter', 'quality_check'] },
  { name: 'Full Service (Major)', category: 'routine', price: 24500, durationMinutes: 210, steps: ['received', 'inspection', 'oil_filter', 'brakes', 'tyres', 'quality_check'] },
  { name: 'Brake Pad Replacement', category: 'repair', price: 12800, durationMinutes: 120, steps: ['received', 'brakes', 'quality_check'] },
  { name: 'Wheel Alignment', category: 'tyres', price: 3500, durationMinutes: 45, steps: ['received', 'tyres'] },
  { name: 'Engine Diagnostic Scan', category: 'diagnostics', price: 1800, durationMinutes: 30, steps: ['received', 'inspection', 'quality_check'] },
  { name: 'Body Repair & Paint', category: 'bodywork', price: 15000, durationMinutes: 480, steps: ['received', 'body_work', 'quality_check'] },
  { name: 'Annual Vehicle Inspection', category: 'inspection', price: 4200, durationMinutes: 60, steps: ['received', 'inspection', 'quality_check'] },
  { name: 'Battery Replacement', category: 'repair', price: 16500, durationMinutes: 45, steps: ['received', 'quality_check'] }
]

const DEFAULT_WORKING_HOURS = [1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  open: '08:00',
  close: '18:00',
  isClosed: false
}))

export const registerCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) throw new ApiError(409, 'An account with this email already exists')

  const user = await User.create({
    name,
    email,
    phone,
    password: await bcrypt.hash(password, 10),
    role: 'customer'
  })

  notifyUser({
    user,
    type: 'welcome',
    title: 'Welcome to AutoCare',
    body: `Hi ${user.name}, your account is ready. Book your first service in a couple of clicks.`
  }).catch(() => {})

  res.status(201).json({ token: signToken(user), user: user.toPublicJSON() })
})

export const registerStation = asyncHandler(async (req, res) => {
  const { name, email, phone, password, address, city, district, description, slotMinutes, bayCount } = req.body

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) throw new ApiError(409, 'An account with this email already exists')

  const user = await User.create({
    name: req.body.ownerName || name,
    email,
    phone,
    password: await bcrypt.hash(password, 10),
    role: 'station'
  })

  const station = await Station.create({
    name,
    slug: slugify(name),
    description: description || '',
    owner: user._id,
    email,
    phone,
    address: { line1: address, city, district: district || '' },
    workingHours: DEFAULT_WORKING_HOURS,
    slotMinutes: Number(slotMinutes) || 60,
    bayCount: Number(bayCount) || 2
  })

  user.station = station._id
  await user.save()

  await Service.insertMany(
    DEFAULT_SERVICES.map((service) => ({
      ...service,
      station: station._id,
      steps: service.steps?.length ? service.steps : STEP_FLOW
    }))
  )

  notifyUser({
    user,
    station: station._id,
    type: 'station_registered',
    title: 'Station registered',
    body: `${station.name} is now live on AutoCare. You can add services and start accepting bookings.`
  }).catch(() => {})

  res.status(201).json({
    token: signToken(user),
    user: user.toPublicJSON(),
    station
  })
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, 'Email or password is incorrect')
  }
  if (!user.isActive) throw new ApiError(403, 'This account is disabled')

  const station = user.station ? await Station.findById(user.station) : null

  res.json({ token: signToken(user), user: user.toPublicJSON(), station })
})

export const me = asyncHandler(async (req, res) => {
  const station = req.user.station ? await Station.findById(req.user.station) : null
  res.json({ user: req.user.toPublicJSON(), station })
})

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'notifications']
  for (const field of allowed) {
    if (req.body[field] !== undefined) req.user[field] = req.body[field]
  }
  await req.user.save()
  res.json({ user: req.user.toPublicJSON() })
})

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(422, 'New password must be at least 6 characters')
  }

  const user = await User.findById(req.user._id).select('+password')
  if (!(await bcrypt.compare(currentPassword || '', user.password))) {
    throw new ApiError(401, 'Current password is incorrect')
  }

  user.password = await bcrypt.hash(newPassword, 10)
  await user.save()
  res.json({ message: 'Password updated' })
})

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    channel: 'in_app',
    status: { $ne: 'read' }
  })
  res.json({ count })
})