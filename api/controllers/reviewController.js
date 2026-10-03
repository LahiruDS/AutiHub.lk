import mongoose from 'mongoose'
import { Booking } from '../models/Booking.js'
import { Station } from '../models/Station.js'
import Review from '../models/Review.js'
import { ApiError, asyncHandler } from '../middleware/error.js'
import { notifyUser } from '../utils/notifier.js'
import { User } from '../models/User.js'

const { ObjectId } = mongoose.Types

const shape = (review, stationOwner = null) => ({
  id: review._id,
  booking: review.booking,
  station: review.station,
  customer: review.customer,
  rating: review.rating,
  title: review.title,
  comment: review.comment,
  serviceQuality: review.serviceQuality,
  punctuality: review.punctuality,
  staffBehaviour: review.staffBehaviour,
  stationReply: review.stationReply,
  createdAt: review.createdAt,
  customerName: review.customer?.name || stationOwner?.name,
  customerRole: stationOwner ? 'station' : 'customer',
  vehicle: review.vehicle
})

export const createReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, title, comment, serviceQuality, punctuality, staffBehaviour } = req.body

  const booking = await Booking.findOne({ _id: bookingId, customer: req.user._id })
  if (!booking) throw new ApiError(404, 'Booking not found')
  if (booking.status !== 'completed') throw new ApiError(400, 'You can review only after the service is completed')

  const review = await Review.create({
    booking: booking._id,
    station: booking.station,
    customer: req.user._id,
    vehicle: booking.vehicle,
    rating: Number(rating),
    title,
    comment,
    serviceQuality: serviceQuality ? Number(serviceQuality) : undefined,
    punctuality: punctuality ? Number(punctuality) : undefined,
    staffBehaviour: staffBehaviour ? Number(staffBehaviour) : undefined
  })

  await Review.refreshStationRating(booking.station)

  const station = await Station.findById(booking.station).select('name owner')
  const stationOwner = await User.findById(station.owner)

  notifyUser({
    user: stationOwner,
    station: station._id,
    booking: booking._id,
    type: 'review_added',
    title: `New ${Number(rating)}-star review`,
    body: `${req.user.name} reviewed your station: ${title || comment || 'No comment'}`
  }).catch(() => {})

  res.status(201).json({ review: shape(review.toObject(), null) })
})

export const listStationReviews = asyncHandler(async (req, res) => {
  const { stationId } = req.params
  const { page = 1, limit = 10, minRating } = req.query

  if (!ObjectId.isValid(stationId)) throw new ApiError(400, 'Invalid station')

  const filter = { station: stationId, isHidden: false }
  if (minRating) filter.rating = { $gte: Number(minRating) }

  const perPage = Math.min(Number(limit) || 10, 50)
  const skip = (Math.max(Number(page) || 1, 1) - 1) * perPage

  const [reviews, total, stats] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage)
      .populate('customer', 'name')
      .populate('vehicle', 'make model')
      .lean(),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: { station: new ObjectId(stationId), isHidden: false } },
      { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
    ])
  ])

  const summary = stats[0] || { average: 0, count: 0 }

  res.json({
    total,
    page: Number(page) || 1,
    pages: Math.ceil(total / perPage),
    averageRating: Math.round(summary.average * 10) / 10,
    breakdown: summary.count,
    reviews: reviews.map(shape)
  })
})

export const replyToReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, station: req.station._id })
  if (!review) throw new ApiError(404, 'Review not found')

  review.stationReply = req.body.reply
  await review.save()

  const customer = await User.findById(review.customer)
  notifyUser({
    user: customer,
    station: review.station,
    booking: review.booking,
    type: 'review_reply',
    title: 'Station replied to your review',
    body: req.body.reply
  }).catch(() => {})

  res.json({ review: shape(review.toObject(), null) })
})

export const toggleReviewVisibility = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, station: req.station._id })
  if (!review) throw new ApiError(404, 'Review not found')

  review.isHidden = !review.isHidden
  await review.save()
  await Review.refreshStationRating(review.station)

  res.json({ review: shape(review.toObject(), null) })
})

export const canReviewBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, customer: req.user._id }).lean()
  if (!booking) throw new ApiError(404, 'Booking not found')

  const existing = await Review.exists({ booking: booking._id })
  res.json({
    canReview: booking.status === 'completed' && !existing,
    reason: existing ? 'already_reviewed' : booking.status !== 'completed' ? 'not_completed' : null
  })
})