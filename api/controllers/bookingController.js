import mongoose from 'mongoose'
import { Booking, BOOKING_STATUSES } from '../models/Booking.js'
import { Service } from '../models/Service.js'
import { Station } from '../models/Station.js'
import { User } from '../models/User.js'
import { Vehicle } from '../models/Vehicle.js'
import { Review } from '../models/Review.js'
import { ApiError, asyncHandler } from '../middleware/error.js'
import { notifyUser } from '../utils/notifier.js'
import {
  buildSlots,
  withAvailability,
  isPastSlot,
  isValidDateString,
  todayString,
  maxBookableDate
} from '../utils/slots.js'
import { getStepLabel, progressFor, STEP_STATUSES } from '../utils/steps.js'

const { ObjectId } = mongoose.Types

const isValidId = (value) => ObjectId.isValid(value) && String(new ObjectId(value)) === value

const STATUS_MESSAGES = {
  pending: 'Your booking request was sent. The station will confirm shortly.',
  confirmed: 'Booking confirmed. See you on the scheduled day.',
  in_progress: 'Work on your vehicle has started.',
  on_hold: 'Your service is on hold. The station will update you soon.',
  completed: 'Service completed. Your vehicle is ready for pickup.',
  cancelled: 'This booking was cancelled.',
  no_show: 'This booking was marked as a no show.'
}

const resolveStepProgress = (booking) => {
  if (!booking.steps?.length) return booking.status === 'in_progress' ? 50 : 0

  if (booking.status === 'completed') return 100
  if (!['in_progress', 'on_hold'].includes(booking.status)) return 0

  const index = booking.currentStep ? booking.steps.indexOf(booking.currentStep) : 0
  return progressFor({ status: booking.status, steps: booking.steps, currentStep: booking.steps[index] })
}

const shapeBooking = (booking, extras = {}) => ({
  ...booking.toPublicJSON(extras.currentStepLabel),
  customer: extras.customer || booking.customer,
  station: extras.station || booking.station,
  vehicle: extras.vehicle ?? booking.vehicle,
  progress: extras.progress ?? resolveStepProgress(booking)
})

export const getSlots = asyncHandler(async (req, res) => {
  const { stationId, date } = req.query

  if (!isValidId(stationId)) throw new ApiError(400, 'Invalid service station')
  if (!isValidDateString(date)) throw new ApiError(400, 'Invalid date, use YYYY-MM-DD')

  if (date < todayString()) {
    return res.json({ date, slots: [], closed: true, message: 'This date has already passed' })
  }
  if (date > maxBookableDate()) {
    return res.json({ date, slots: [], closed: true, message: `Bookings open ${maxBookableDate()} days ahead` })
  }

  const station = await Station.findById(stationId).select('name workingHours slotMinutes bayCount isActive').lean()
  if (!station) throw new ApiError(404, 'Service station not found')
  if (!station.isActive) throw new ApiError(400, 'This station is not accepting bookings')

  const slots = buildSlots({ date, workingHours: station.workingHours, slotMinutes: station.slotMinutes })

  const dayStart = new Date(`${date}T00:00:00`)
  const dayEnd = new Date(`${date}T23:59:59`)
  const bookings = await Booking.find({
    station: stationId,
    date,
    slotStartAt: { $gte: dayStart, $lte: dayEnd }
  })
    .select('slotStart status')
    .lean()

  const availability = withAvailability(slots, bookings).map((slot) => ({
    ...slot,
    isPast: isPastSlot(date, slot.start),
    isAvailable: !slot.isBooked && !isPastSlot(date, slot.start)
  }))

  res.json({
    date,
    stationId,
    stationName: station.name,
    workingDay: !slots.length,
    total: availability.length,
    available: availability.filter((slot) => slot.isAvailable).length,
    slots: availability
  })
})

export const createBooking = asyncHandler(async (req, res) => {
  const { stationId, vehicleId, serviceIds, date, slotStart, slotEnd, customerNote } = req.body

  if (!isValidId(stationId)) throw new ApiError(400, 'Choose a valid service station')
  if (!isValidDateString(date)) throw new ApiError(400, 'Invalid date, use YYYY-MM-DD')
  if (!slotStart || !slotEnd) throw new ApiError(400, 'Choose a time slot')

  if (date < todayString()) throw new ApiError(400, 'Pick a date that is not in the past')
  if (date > maxBookableDate()) throw new ApiError(400, `Bookings only open ${maxBookableDate()} days ahead`)
  if (isPastSlot(date, slotStart)) throw new ApiError(400, 'That time slot has already passed')

  const station = await Station.findById(stationId)
  if (!station) throw new ApiError(404, 'Service station not found')
  if (!station.isActive) throw new ApiError(400, 'This station is not accepting bookings')

  const vehicle = vehicleId ? await Vehicle.findOne({ _id: vehicleId, owner: req.user._id }) : null
  if (vehicleId && !vehicle) throw new ApiError(404, 'Vehicle not found in your garage')

  const ids = Array.isArray(serviceIds) ? serviceIds.filter(isValidId) : []
  const services = await Service.find({ _id: { $in: ids }, station: stationId, isActive: true })
  if (services.length !== ids.length) throw new ApiError(400, 'One or more selected services are unavailable')

  const totalDuration = services.reduce((sum, service) => sum + (service.durationMinutes || 60), 0)

  const overlap = await Booking.findOne({
    station: stationId,
    date,
    slotStart,
    status: { $nin: ['cancelled', 'no_show'] }
  })
  if (overlap) throw new ApiError(409, 'That slot was just taken, please pick another one')

  const steps = [...new Set(services.flatMap((service) => service.steps || []))]
  if (steps.length === 0) {
    steps.push(...(station.services?.filter((step) => step.active).map((step) => step.key) || []))
  }

  const slotStartAt = new Date(`${date}T${slotStart}:00`)
  const slotEndAt = new Date(`${date}T${slotEnd}:00`)

  const booking = await Booking.create({
    customer: req.user._id,
    station: stationId,
    vehicle: vehicle?._id || null,
    items: services.map((service) => ({
      service: service._id,
      name: service.name,
      price: service.price,
      durationMinutes: service.durationMinutes
    })),
    totalPrice: services.reduce((sum, service) => sum + service.price, 0),
    steps,
    currentStep: null,
    date,
    slotStart,
    slotEnd,
    slotStartAt,
    slotEndAt,
    status: 'pending',
    customerNote: customerNote || '',
    history: [
      { status: 'pending', note: 'Booking request created', changedBy: req.user._id, changedByRole: req.user.role, at: new Date() }
    ]
  })

  const stationOwner = await User.findById(station.owner).populate('station')
  notifyUser({
    user: stationOwner,
    station: station._id,
    booking: booking._id,
    type: 'booking_requested',
    title: 'New booking request',
    body: `${station.name} received a booking for ${date} at ${slotStart}. Reference ${booking.reference}.`
  }).catch(() => {})

  notifyUser({
    user: req.user,
    station: station._id,
    booking: booking._id,
    type: 'booking_created',
    title: 'Booking request sent',
    body: `${station.name} - ${date} at ${slotStart}. Reference ${booking.reference}. We will notify you when it is confirmed.`
  }).catch(() => {})

  const fresh = await Booking.findById(booking._id)
    .populate('station', 'name slug address phone rating')
    .populate('vehicle', 'make model registrationNumber')

  res.status(201).json({
    booking: shapeBooking(fresh, {
      station: fresh.station,
      vehicle: fresh.vehicle,
      progress: 0
    })
  })
})

export const getMyBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query

  const filter = { customer: req.user._id }
  if (status && status !== 'all') filter.status = status

  const perPage = Math.min(Number(limit) || 10, 50)
  const skip = (Math.max(Number(page) || 1, 1) - 1) * perPage

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ slotStartAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(perPage)
      .populate('station', 'name slug address phone rating')
      .populate('vehicle', 'make model registrationNumber'),
    Booking.countDocuments(filter)
  ])

  res.json({
    total,
    page: Number(page) || 1,
    pages: Math.ceil(total / perPage),
    bookings: bookings.map((booking) =>
      shapeBooking(booking, {
        station: booking.station,
        vehicle: booking.vehicle,
        currentStepLabel: getStepLabel(booking.currentStep)
      })
    )
  })
})

export const getStationBookings = asyncHandler(async (req, res) => {
  const { status, date, page = 1, limit = 20 } = req.query

  const filter = { station: req.station._id }
  if (status && status !== 'all') filter.status = status
  if (date) filter.date = date

  const perPage = Math.min(Number(limit) || 20, 100)
  const skip = (Math.max(Number(page) || 1, 1) - 1) * perPage

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ date: 1, slotStart: 1 })
      .skip(skip)
      .limit(perPage)
      .populate('customer', 'name email phone')
      .populate('vehicle', 'make model registrationNumber fuelType'),
    Booking.countDocuments(filter)
  ])

  res.json({
    total,
    page: Number(page) || 1,
    pages: Math.ceil(total / perPage),
    bookings: bookings.map((booking) =>
      shapeBooking(booking, {
        customer: booking.customer,
        vehicle: booking.vehicle,
        currentStepLabel: getStepLabel(booking.currentStep)
      })
    )
  })
})

/** Live polling endpoint. Kept lightweight on purpose. */
export const getBookingStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('station', 'name slug phone address rating')
    .populate('vehicle', 'make model registrationNumber')
    .lean()

  if (!booking) throw new ApiError(404, 'Booking not found')

  const isOwner = String(booking.customer) === String(req.user._id)
  const isStation = req.user.role === 'station' && String(booking.station._id) === String(req.user.station)
  if (!isOwner && !isStation && req.user.role !== 'admin') {
    throw new ApiError(403, 'You cannot view this booking')
  }

  const shapeLean = {
    id: booking._id,
    reference: booking.reference,
    station: booking.station,
    vehicle: booking.vehicle,
    items: booking.items,
    totalPrice: booking.totalPrice,
    steps: booking.steps,
    currentStep: booking.currentStep,
    currentStepLabel: getStepLabel(booking.currentStep),
    date: booking.date,
    slotStart: booking.slotStart,
    slotEnd: booking.slotEnd,
    status: booking.status,
    statusMessage: STATUS_MESSAGES[booking.status] || '',
    paymentStatus: booking.paymentStatus,
    stationNote: booking.stationNote,
    customerNote: booking.customerNote,
    history: booking.history,
    startedAt: booking.startedAt,
    completedAt: booking.completedAt,
    createdAt: booking.createdAt,
    progress: resolveStepProgress(booking)
  }

  const review = await Review.exists({ booking: booking._id })

  res.json({ booking: shapeLean, canReview: isOwner && booking.status === 'completed' && !review })
})

/**
 * Loads the booking and checks the caller is allowed to act on it.
 * Sets req.booking and, for station users, req.station.
 */
export const loadBookingForAction = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
  if (!booking) throw new ApiError(404, 'Booking not found')

  const isAdmin = req.user.role === 'admin'
  const isCustomer = req.user.role === 'customer' && String(booking.customer) === String(req.user._id)
  const isStation =
    req.user.role === 'station' &&
    Boolean(req.user.station) &&
    String(booking.station) === String(req.user.station)

  if (!isAdmin && !isCustomer && !isStation) {
    throw new ApiError(403, 'You cannot change this booking')
  }

  if (isStation && !isCustomer) {
    req.station = await Station.findById(booking.station)
  }

  req.booking = booking
  return next()
})

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, note, currentStep, paymentStatus } = req.body
  const booking = req.booking

  const customer = await User.findById(booking.customer)

  if (currentStep !== undefined) {
    if (!STEP_STATUSES.includes(status)) {
      throw new ApiError(400, 'To change a step, status must be in_progress or on_hold')
    }
    if (booking.steps.length && !booking.steps.includes(currentStep)) {
      throw new ApiError(400, 'That step is not part of this booking')
    }
    booking.currentStep = currentStep
  }

  if (paymentStatus !== undefined) {
    if (req.user.role !== 'station') throw new ApiError(403, 'Only the station can change payment')
    booking.paymentStatus = paymentStatus
  }

  if (note !== undefined) booking.stationNote = note

  const nextStatus = status || (currentStep ? 'in_progress' : undefined)

  if (nextStatus) {
    if (!BOOKING_STATUSES.includes(nextStatus)) throw new ApiError(400, 'Unknown status')

    const isCustomer = req.user.role === 'customer'
    if (isCustomer && (nextStatus !== 'cancelled' || !['pending', 'confirmed'].includes(booking.status))) {
      throw new ApiError(403, 'Contact the station to change this booking')
    }

    booking.status = nextStatus

    if (nextStatus === 'in_progress' && !booking.startedAt) {
      booking.startedAt = new Date()
      booking.currentStep = booking.currentStep || booking.steps[0] || null
    }
    if (nextStatus === 'completed') {
      booking.completedAt = new Date()
      booking.currentStep = booking.steps[booking.steps.length - 1] || null
      if (booking.vehicle) {
        await Vehicle.findByIdAndUpdate(booking.vehicle, {
          lastServiceDate: new Date(),
          lastServiceOdometer: booking.odometer ?? undefined,
          $inc: { serviceCount: 1 }
        })
      }
    }
    if (['cancelled', 'no_show'].includes(nextStatus)) {
      booking.completedAt = new Date()
    }

    booking.history.push({
      status: nextStatus,
      note: note || STATUS_MESSAGES[nextStatus] || '',
      changedBy: req.user._id,
      changedByRole: req.user.role,
      at: new Date()
    })
  }

  await booking.save()

  if (nextStatus) {
    const stepSuffix = currentStep ? ` Step: ${getStepLabel(currentStep)}.` : ''
    notifyUser({
      user: customer,
      station: booking.station,
      booking: booking._id,
      type: `booking_${nextStatus}`,
      title: `Booking ${booking.reference} - ${nextStatus.replace('_', ' ')}`,
      body: `${STATUS_MESSAGES[nextStatus] || ''}${stepSuffix}`
    }).catch(() => {})

    if (nextStatus === 'cancelled' && req.user.role === 'customer') {
      const stationDoc = await Station.findById(booking.station).select('owner')
      const stationOwner = stationDoc ? await User.findById(stationDoc.owner) : null
      if (stationOwner) {
        notifyUser({
          user: stationOwner,
          station: booking.station,
          booking: booking._id,
          type: 'booking_cancelled',
          title: `Booking ${booking.reference} cancelled by customer`,
          body: `The customer cancelled the booking for ${booking.date} at ${booking.slotStart}.`
        }).catch(() => {})
      }
    }
  }

  await booking.populate('station', 'name slug address phone rating')
  await booking.populate('vehicle', 'make model registrationNumber')

  res.json({ booking: shapeBooking(booking, { currentStepLabel: getStepLabel(booking.currentStep) }) })
})

export const listAvailableDates = asyncHandler(async (req, res) => {
  const stationId = req.query.stationId
  if (!isValidId(stationId)) throw new ApiError(400, 'Invalid service station')

  const station = await Station.findById(stationId).select('workingHours slotMinutes').lean()
  if (!station) throw new ApiError(404, 'Service station not found')

  const dates = []
  const cursor = new Date(`${todayString()}T00:00:00`)
  const limit = maxBookableDate()

  while (cursor.toISOString().slice(0, 10) <= limit) {
    const dateString = cursor.toISOString().slice(0, 10)
    const slots = buildSlots({
      date: dateString,
      workingHours: station.workingHours,
      slotMinutes: station.slotMinutes
    })
    dates.push({ date: dateString, slotCount: slots.length })
    cursor.setDate(cursor.getDate() + 1)
  }

  res.json({ dates })
})