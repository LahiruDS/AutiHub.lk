import { Router } from 'express'
import {
  listVehicles,
  createVehicle,
  updateVehicle,
  setDefaultVehicle,
  deleteVehicle,
  getVehicleHistory
} from '../controllers/vehicleController.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

router.use(authenticate, requireRole('customer'))

router.get('/', listVehicles)
router.post('/', validate('vehicle'), createVehicle)
router.get('/:id/history', getVehicleHistory)
router.patch('/:id', updateVehicle)
router.patch('/:id/default', setDefaultVehicle)
router.delete('/:id', deleteVehicle)

export default router