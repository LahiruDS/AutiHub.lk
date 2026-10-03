import { Service, SERVICE_CATEGORIES } from '../models/Service.js'
import { Station } from '../models/Station.js'
import { Booking } from '../models/Booking.js'
import { ApiError, asyncHandler } from '../middleware/error.js'

export const shapeService = (service) => ({
  id: service._id ?? service.id,
  station: service.station,
  name: service.name,
  description: service.description,
  category: service.category,
  price: service.price,
  priceUnit: service.priceUnit,
  durationMinutes: service.durationMinutes,
  steps: service.steps,
  isActive: service.isActive
})

const shape = shapeService

export const listServices = asyncHandler(async (req, res) => {
  const filter = { isActive: true }

  if (req.query.station) filter.station = req.query.station
  if (req.query.category) filter.category = req.query.category
  if (req.query.search) filter.name = new RegExp(req.query.search, 'i')
  if (req.query.maxPrice) filter.price = { $lte: Number(req.query.maxPrice) }

  const services = await Service.find(filter).sort({ category: 1, price: 1 }).lean()

  res.json({ services: services.map(shape), categories: SERVICE_CATEGORIES })
})

export const createService = asyncHandler(async (req, res) => {
  const { name, description, category, price, priceUnit, durationMinutes, steps } = req.body

  const service = await Service.create({
    station: req.station._id,
    name,
    description,
    category,
    price: Number(price),
    priceUnit,
    durationMinutes: Number(durationMinutes) || 60,
    steps
  })

  res.status(201).json({ service: shape(service) })
})

export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, station: req.station._id })
  if (!service) throw new ApiError(404, 'Service not found')

  const fields = ['name', 'description', 'category', 'price', 'priceUnit', 'durationMinutes', 'steps', 'isActive']
  for (const field of fields) {
    if (req.body[field] !== undefined) service[field] = req.body[field]
  }

  await service.save()
  res.json({ service: shape(service) })
})

export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findOneAndUpdate(
    { _id: req.params.id, station: req.station._id },
    { isActive: false },
    { new: true }
  )
  if (!service) throw new ApiError(404, 'Service not found')
  res.json({ message: 'Service removed', service: shape(service) })
})

export const getStationStats = asyncHandler(async (req, res) => {
  const stationId = req.station._id

  const [serviceCount, bookingCount, completedCount, revenueAgg, todayCount] = await Promise.all([
    Service.countDocuments({ station: stationId, isActive: true }),
    Booking.countDocuments({ station: stationId }),
    Booking.countDocuments({ station: stationId, status: 'completed' }),
    Booking.aggregate([
      { $match: { station: stationId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]),
    Booking.countDocuments({
      station: stationId,
      date: new Date().toISOString().slice(0, 10),
      status: { $ne: 'cancelled' }
    })
  ])

  const station = await Station.findById(stationId).select('name rating address').lean()

  res.json({
    station,
    serviceCount,
    bookingCount,
    completedCount,
    totalRevenue: revenueAgg[0]?.total || 0,
    todayCount,
    averageRating: station?.rating?.average || 0,
    reviewCount: station?.rating?.count || 0
  })
})