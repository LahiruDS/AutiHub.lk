import { Router } from 'express'
import {
  registerCustomer,
  registerStation,
  login,
  me,
  updateProfile,
  changePassword,
  unreadCount
} from '../controllers/authController.js'
import { validate } from '../middleware/validate.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/register/customer', validate('registerCustomer'), registerCustomer)
router.post('/register/station', validate('registerStation'), registerStation)
router.post('/login', validate('login'), login)
router.get('/me', authenticate, me)
router.patch('/profile', authenticate, updateProfile)
router.post('/change-password', authenticate, changePassword)
router.get('/notifications/unread-count', authenticate, unreadCount)

export default router