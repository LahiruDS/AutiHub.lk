import { Router } from 'express'
import {
  listServices,
  createService,
  updateService,
  deleteService,
  getStationStats
} from '../controllers/serviceController.js'
import { authenticate, requireRole, requireStationOwner } from '../middleware/auth.js'

const router = Router()

router.get('/', listServices)

router.post('/', authenticate, requireRole('station'), requireStationOwner, createService)
router.patch('/:id', authenticate, requireRole('station'), requireStationOwner, updateService)
router.delete('/:id', authenticate, requireRole('station'), requireStationOwner, deleteService)

router.get('/stats', authenticate, requireRole('station'), requireStationOwner, getStationStats)

export default router