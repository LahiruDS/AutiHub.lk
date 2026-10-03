import { Router } from 'express'
import {
  listNotifications,
  markRead,
  removeNotification
} from '../controllers/notificationController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', listNotifications)
router.patch('/read-all', markRead)
router.patch('/:id/read', markRead)
router.delete('/:id', removeNotification)

export default router