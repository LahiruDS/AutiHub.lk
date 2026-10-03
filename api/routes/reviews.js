import { Router } from 'express'
import {
  createReview,
  listStationReviews,
  replyToReview,
  toggleReviewVisibility,
  canReviewBooking
} from '../controllers/reviewController.js'
import { authenticate, requireRole, requireStationOwner } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

router.get('/station/:stationId', listStationReviews)
router.get('/booking/:id/can-review', authenticate, requireRole('customer'), canReviewBooking)

router.post('/', authenticate, requireRole('customer'), validate('review'), createReview)
router.patch('/:id/reply', authenticate, requireRole('station'), requireStationOwner, replyToReview)
router.patch('/:id/visibility', authenticate, requireRole('station'), requireStationOwner, toggleReviewVisibility)

export default router