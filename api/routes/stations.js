import { Router } from 'express'
import {
  listStations,
  getStation,
  updateMyStation,
  listServiceCategories,
  listWorkflowSteps
} from '../controllers/stationController.js'
import { getStationBookings } from '../controllers/bookingController.js'
import { authenticate, requireRole, requireStationOwner } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { Booking } from '../models/Booking.js'
import { todayString } from '../utils/slots.js'

const router = Router()

router.get('/', listStations)
router.get('/categories', listServiceCategories)
router.get('/workflow-steps', listWorkflowSteps)

router.patch('/me', authenticate, requireRole('station'), requireStationOwner, updateMyStation)

router.get(
  '/me/dashboard',
  authenticate,
  requireRole('station'),
  requireStationOwner,
  asyncHandler(async (req, res) => {
    const stationId = req.station._id
    const today = todayString()

    const [todayBookings, upcoming, statusCounts] = await Promise.all([
      Booking.find({ station: stationId, date: today })
        .sort({ slotStart: 1 })
        .populate('customer', 'name phone')
        .populate('vehicle', 'make model registrationNumber')
        .lean(),
      Booking.countDocuments({
        station: stationId,
        date: { $gt: today },
        status: { $in: ['pending', 'confirmed'] }
      }),
      Booking.aggregate([
        { $match: { station: stationId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ])

    res.json({
      today: todayBookings,
      upcomingCount: upcoming,
      statusCounts: Object.fromEntries(statusCounts.map((row) => [row._id, row.count]))
    })
  })
)

router.get('/mine/bookings', authenticate, requireRole('station'), requireStationOwner, getStationBookings)

router.get('/:idOrSlug', getStation)

export default router