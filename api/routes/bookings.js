import { Router } from 'express'
import {
  getSlots,
  createBooking,
  getMyBookings,
  getStationBookings,
  getBookingStatus,
  updateBookingStatus,
  loadBookingForAction,
  listAvailableDates
} from '../controllers/bookingController.js'
import { authenticate, requireRole, requireStationOwner } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

router.get('/slots', getSlots)
router.get('/dates', listAvailableDates)

router.post('/', authenticate, requireRole('customer'), validate('booking'), createBooking)
router.get('/mine', authenticate, requireRole('customer'), getMyBookings)
router.get('/station', authenticate, requireRole('station'), requireStationOwner, getStationBookings)

router.get('/:id', authenticate, getBookingStatus)
router.patch('/:id/status', authenticate, loadBookingForAction, updateBookingStatus)

export default router