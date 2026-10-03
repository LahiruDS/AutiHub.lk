import mongoose from 'mongoose'
import { Station, SERVICE_STEP_KEYS } from '../models/Station.js'
import { Service, SERVICE_CATEGORIES } from '../models/Service.js'
import { shapeService } from './serviceController.js'
import Review from '../models/Review.js'
import { ApiError, asyncHandler } from '../middleware/error.js'

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const shapeStation = (station, extras = {}) => ({
  id: station._id,
  name: station.name,
  slug: station.slug,
  description: station.description,
  email: station.email,
  phone: station.phone,
  address: station.address,
  location: station.location,
  logoUrl: station.logoUrl,
  images: station.images,
  workingHours: station.workingHours,
  bayCount: station.bayCount,
  slotMinutes: station.slotMinutes,
  rating: station.rating,
  isActive: station.isActive,
  ...extras
})

export const listStations = asyncHandler(async (req, res) => {
  const { search, city, district, service, minRating, sort = 'rating', page = 1, limit = 12 } = req.query

  const filter = { isActive: true }

  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i')
    filter.$or = [{ name: rx }, { description: rx }, { 'address.city': rx }, { 'address.district': rx }]
  }
  if (city) filter['address.city'] = new RegExp(`^${escapeRegex(city)}$`, 'i')
  if (district) filter['address.district'] = new RegExp(`^${escapeRegex(district)}$`, 'i')
  if (minRating) filter['rating.average'] = { $gte: Number(minRating) }

  if (service) {
    const matched = await Service.find({ name: new RegExp(escapeRegex(service), 'i'), isActive: true })
      .distinct('station')
    filter._id = { $in: matched }
  }

  const sortMap = {
    rating: { 'rating.average': -1, 'rating.count': -1 },
    name: { name: 1 },
    newest: { createdAt: -1 }
  }

  const perPage = Math.min(Number(limit) || 12, 50)
  const skip = (Math.max(Number(page) || 1, 1) - 1) * perPage

  const [stations, total] = await Promise.all([
    Station.find(filter)
      .sort(sortMap[sort] || sortMap.rating)
      .skip(skip)
      .limit(perPage)
      .lean(),
    Station.countDocuments(filter)
  ])

  const stationIds = stations.map((station) => station._id)

  const [serviceCounts, minPrices] = await Promise.all([
    Service.aggregate([
      { $match: { station: { $in: stationIds }, isActive: true } },
      { $group: { _id: '$station', count: { $sum: 1 } } }
    ]),
    Service.aggregate([
      { $match: { station: { $in: stationIds }, isActive: true } },
      { $group: { _id: '$station', min: { $min: '$price' } } }
    ])
  ])

  const countMap = Object.fromEntries(serviceCounts.map((item) => [String(item._id), item.count]))
  const priceMap = Object.fromEntries(minPrices.map((item) => [String(item._id), item.min]))

  res.json({
    total,
    page: Number(page) || 1,
    pages: Math.ceil(total / perPage),
    stations: stations.map((station) =>
      shapeStation(station, {
        serviceCount: countMap[String(station._id)] || 0,
        startingPrice: priceMap[String(station._id)] ?? null
      })
    )
  })
})

export const getStation = asyncHandler(async (req, res) => {
  const value = req.params.idOrSlug
  const isId = /^[a-f\d]{24}$/i.test(value)

  const station = await Station.findOne(isId ? { _id: value } : { slug: value.toLowerCase() }).lean()
  if (!station) throw new ApiError(404, 'Service station not found')

  const [services, reviews] = await Promise.all([
    Service.find({ station: station._id, isActive: true }).sort({ category: 1, price: 1 }).lean(),
    Review.find({ station: station._id, isHidden: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('customer', 'name')
      .populate('vehicle', 'make model')
      .lean()
  ])

  const ratingBreakdown = await Review.aggregate([
    { $match: { station: station._id, isHidden: false } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } }
  ])

  res.json({
    station: shapeStation(station, { services: services.map(shapeService) }),
    reviews: reviews.map((review) => ({
      id: review._id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      stationReply: review.stationReply,
      createdAt: review.createdAt,
      customerName: review.customer?.name || 'Customer',
      vehicle: review.vehicle
    })),
    ratingBreakdown: Object.fromEntries(ratingBreakdown.map((row) => [row._id, row.count]))
  })
})

export const updateMyStation = asyncHandler(async (req, res) => {
  const station = await Station.findById(req.station._id)
  if (!station) throw new ApiError(404, 'Station not found')

  const fields = ['name', 'description', 'phone', 'address', 'logoUrl', 'images', 'workingHours', 'bayCount', 'slotMinutes', 'location']
  for (const field of fields) {
    if (req.body[field] !== undefined) station[field] = req.body[field]
  }

  if (req.body.name) station.slug = slugify(req.body.name)

  await station.save()
  res.json({ station: shapeStation(station.toObject()) })
})

export const listServiceCategories = asyncHandler(async (req, res) => {
  res.json({ categories: SERVICE_CATEGORIES })
})

export const listWorkflowSteps = asyncHandler(async (req, res) => {
  res.json({ steps: SERVICE_STEP_KEYS })
})