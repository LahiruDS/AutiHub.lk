import { Vehicle } from '../models/Vehicle.js'
import { Booking } from '../models/Booking.js'
import { ApiError, asyncHandler } from '../middleware/error.js'

const shape = (vehicle) => ({
  id: vehicle._id,
  make: vehicle.make,
  model: vehicle.model,
  year: vehicle.year,
  registrationNumber: vehicle.registrationNumber,
  fuelType: vehicle.fuelType,
  transmission: vehicle.transmission,
  lastServiceDate: vehicle.lastServiceDate,
  lastServiceOdometer: vehicle.lastServiceOdometer,
  serviceCount: vehicle.serviceCount ?? 0,
  notes: vehicle.notes,
  isDefault: vehicle.isDefault,
  bookingCount: vehicle.bookingCount
})

export const listVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({ owner: req.user._id, isArchived: false })
    .sort({ isDefault: -1, createdAt: -1 })
    .lean()

  const counts = await Booking.aggregate([
    { $match: { vehicle: { $in: vehicles.map((vehicle) => vehicle._id) } } },
    { $group: { _id: '$vehicle', count: { $sum: 1 } } }
  ])
  const countMap = Object.fromEntries(counts.map((row) => [String(row._id), row.count]))

  res.json({
    vehicles: vehicles.map((vehicle) => shape({ ...vehicle, bookingCount: countMap[String(vehicle._id)] || 0 }))
  })
})

export const createVehicle = asyncHandler(async (req, res) => {
  const { make, model, year, registrationNumber, fuelType, transmission, notes, isDefault } = req.body

  const existing = await Vehicle.findOne({
    owner: req.user._id,
    registrationNumber: registrationNumber.toUpperCase()
  })
  if (existing) throw new ApiError(409, 'This vehicle is already in your garage')

  const isFirst = (await Vehicle.countDocuments({ owner: req.user._id, isArchived: false })) === 0

  const vehicle = await Vehicle.create({
    owner: req.user._id,
    make,
    model,
    year: year ? Number(year) : undefined,
    registrationNumber: registrationNumber.toUpperCase(),
    fuelType,
    transmission,
    notes,
    isDefault: isDefault || isFirst
  })

  if (vehicle.isDefault) {
    await Vehicle.updateMany(
      { owner: req.user._id, _id: { $ne: vehicle._id } },
      { isDefault: false }
    )
  }

  res.status(201).json({ vehicle: shape(vehicle) })
})

export const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user._id })
  if (!vehicle) throw new ApiError(404, 'Vehicle not found')

  const fields = ['make', 'model', 'year', 'fuelType', 'transmission', 'notes', 'lastServiceDate', 'lastServiceOdometer', 'isArchived']
  for (const field of fields) {
    if (req.body[field] !== undefined) vehicle[field] = req.body[field]
  }

  await vehicle.save()

  if (vehicle.isDefault) {
    await Vehicle.updateMany(
      { owner: req.user._id, _id: { $ne: vehicle._id } },
      { isDefault: false }
    )
  }

  res.json({ vehicle: shape(vehicle) })
})

export const setDefaultVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user._id })
  if (!vehicle) throw new ApiError(404, 'Vehicle not found')

  vehicle.isDefault = true
  await vehicle.save()
  await Vehicle.updateMany({ owner: req.user._id, _id: { $ne: vehicle._id } }, { isDefault: false })

  res.json({ vehicle: shape(vehicle) })
})

export const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    { isArchived: true, isDefault: false },
    { new: true }
  )
  if (!vehicle) throw new ApiError(404, 'Vehicle not found')
  res.json({ message: 'Vehicle removed' })
})

export const getVehicleHistory = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user._id }).lean()
  if (!vehicle) throw new ApiError(404, 'Vehicle not found')

  const bookings = await Booking.find({ vehicle: vehicle._id })
    .sort({ createdAt: -1 })
    .populate('station', 'name address phone rating')
    .lean()

  const spent = bookings
    .filter((booking) => booking.status === 'completed')
    .reduce((sum, booking) => sum + booking.totalPrice, 0)

  res.json({ vehicle: shape(vehicle), bookings, totalSpent: spent })
})