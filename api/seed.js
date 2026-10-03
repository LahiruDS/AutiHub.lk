/**
 * Seeds demo data so the app is usable immediately.
 * Run: npm run seed  (inside api/)
 */
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import connectDB from './config/db.js'
import { User } from './models/User.js'
import { Station } from './models/Station.js'
import { Service } from './models/Service.js'
import { Vehicle } from './models/Vehicle.js'
import { Booking } from './models/Booking.js'
import Review from './models/Review.js'
import Notification from './models/Notification.js'

const password = await bcrypt.hash('password123', 10)

const STATIONS = [
  {
    name: 'City Auto Care',
    description: 'Full-service garage specialising in Japanese brands. Same-day oil changes and genuine spare parts with a 6-month workmanship warranty.',
    city: 'Colombo',
    district: 'Colombo',
    line1: 'No. 142, Galle Road',
    email: 'cityauto@autocare.lk',
    phone: '011 234 5678',
    rating: { average: 4.6, count: 2 },
    services: [
      { name: 'Regular Service (Oil + Filter)', category: 'routine', price: 9500, durationMinutes: 90, steps: ['received', 'inspection', 'oil_filter', 'quality_check'] },
      { name: 'Full Service (Major)', category: 'routine', price: 24500, durationMinutes: 210, steps: ['received', 'inspection', 'oil_filter', 'brakes', 'tyres', 'quality_check'] },
      { name: 'Brake Pad Replacement', category: 'repair', price: 12800, durationMinutes: 120, steps: ['received', 'brakes', 'quality_check'] },
      { name: 'Wheel Alignment', category: 'tyres', price: 3500, durationMinutes: 45, steps: ['received', 'tyres'] },
      { name: 'Engine Diagnostic Scan', category: 'diagnostics', price: 1800, durationMinutes: 30, steps: ['received', 'inspection', 'quality_check'] },
      { name: 'Battery Replacement', category: 'repair', price: 16500, durationMinutes: 45, steps: ['received', 'quality_check'] }
    ]
  },
  {
    name: 'Express Lube & Tyres',
    description: 'Fast oil change and tyre services while you wait. We handle all makes. Open every day including Sunday mornings.',
    city: 'Colombo',
    district: 'Colombo',
    line1: 'No. 58, Main Road',
    email: 'expresslube@autocare.lk',
    phone: '011 445 2211',
    rating: { average: 4.2, count: 1 },
    services: [
      { name: 'Quick Oil Change', category: 'routine', price: 5500, durationMinutes: 45, steps: ['received', 'oil_filter', 'quality_check'] },
      { name: 'Tyre Replacement (pair)', category: 'tyres', price: 28000, durationMinutes: 90, steps: ['received', 'tyres', 'quality_check'] },
      { name: 'Wheel Balancing', category: 'tyres', price: 1800, durationMinutes: 30, steps: ['received', 'tyres'] },
      { name: 'AC Regas Service', category: 'repair', price: 7500, durationMinutes: 60, steps: ['received', 'inspection', 'quality_check'] }
    ]
  },
  {
    name: 'Premium Body & Paint',
    description: 'Accident repair, dent removal and respray. Colour matching using spectrophotometer. Insurance claim assistance available.',
    city: 'Kandy',
    district: 'Kandy',
    line1: 'No. 9, Lake View Road',
    email: 'premiumbody@autocare.lk',
    phone: '081 220 3344',
    rating: { average: 5, count: 0 },
    services: [
      { name: 'Body Repair & Paint', category: 'bodywork', price: 45000, durationMinutes: 480, steps: ['received', 'body_work', 'quality_check'] },
      { name: 'Dent Removal (PDR)', category: 'bodywork', price: 12000, durationMinutes: 180, steps: ['received', 'body_work', 'quality_check'] },
      { name: 'Underbody Anti-Rust', category: 'routine', price: 8900, durationMinutes: 120, steps: ['received', 'inspection', 'quality_check'] }
    ]
  }
]

const WORKING_HOURS = [1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  open: day === 6 ? '09:00' : '08:00',
  close: '18:00',
  isClosed: false
}))

const run = async () => {
  await connectDB()

  await Promise.all([
    User.deleteMany({}),
    Station.deleteMany({}),
    Service.deleteMany({}),
    Vehicle.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
    Notification.deleteMany({})
  ])

  console.log('[seed] cleared existing data')

  const customer = await User.create({
    name: 'Nimal Perera',
    email: 'customer@autocare.lk',
    phone: '077 123 4567',
    password,
    role: 'customer'
  })

  await Vehicle.create([
    { owner: customer._id, make: 'Toyota', model: 'Axio', year: 2019, registrationNumber: 'WP-CAB-1234', fuelType: 'hybrid', transmission: 'automatic', isDefault: true },
    { owner: customer._id, make: 'Honda', model: 'Fit', year: 2015, registrationNumber: 'WP-CAB-5678', fuelType: 'petrol', transmission: 'manual' }
  ])

  console.log('[seed] customer + 2 vehicles created')

  const stations = []

  for (const entry of STATIONS) {
    const { services, ...stationData } = entry

    const owner = await User.create({
      name: `${stationData.name} Owner`,
      email: stationData.email,
      phone: stationData.phone,
      password,
      role: 'station'
    })

    const station = await Station.create({
      ...stationData,
      slug: stationData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      owner: owner._id,
      address: { line1: stationData.line1, city: stationData.city, district: stationData.district },
      workingHours: WORKING_HOURS,
      slotMinutes: 60,
      bayCount: 3
    })

    owner.station = station._id
    await owner.save()

    const created = await Service.insertMany(services.map((service) => ({ ...service, station: station._id })))

    stations.push({ station, services: created })
    console.log(`[seed] station -> ${station.name}`)
  }

  const first = stations[0]
  const today = new Date()
  const iso = (offset) => {
    const date = new Date(today)
    date.setDate(date.getDate() + offset)
    return date.toISOString().slice(0, 10)
  }

  const bookingSeed = [
    {
      station: first.station._id,
      services: first.services.slice(0, 2),
      date: iso(0),
      slot: '09:00',
      status: 'in_progress',
      currentStep: 'oil_filter'
    },
    {
      station: first.station._id,
      services: [first.services[4]],
      date: iso(1),
      slot: '11:00',
      status: 'confirmed',
      currentStep: null
    },
    {
      station: first.station._id,
      services: [first.services[2]],
      date: iso(-3),
      slot: '14:00',
      status: 'completed',
      currentStep: 'ready',
      review: { rating: 5, title: 'Quick and professional', comment: 'They finished ahead of time and explained everything clearly.', serviceQuality: 5, punctuality: 5, staffBehaviour: 5 }
    },
    {
      station: stations[1].station._id,
      services: [stations[1].services[2]],
      date: iso(-9),
      slot: '10:00',
      status: 'completed',
      currentStep: 'ready',
      review: { rating: 4, title: 'Good work, fair price', comment: 'Happy with the wheel balancing. Waiting area could be better.' }
    },
    {
      station: stations[2].station._id,
      services: [stations[2].services[1]],
      date: iso(-16),
      slot: '13:00',
      status: 'completed',
      currentStep: 'ready',
      review: { rating: 5, title: 'Paint looks brand new', comment: 'Dent removal was perfect and the colour matched exactly.' }
    }
  ]

  const vehicles = await Vehicle.find({ owner: customer._id })

  for (const seed of bookingSeed) {
    const steps = [...new Set(seed.services.flatMap((service) => service.steps))]

    const booking = await Booking.create({
      customer: customer._id,
      station: seed.station,
      vehicle: vehicles[0]._id,
items: seed.services.map((service) => ({
        service: service._id,
        name: service.name,
        price: service.price,
        durationMinutes: service.durationMinutes
      })),
      totalPrice: seed.services.reduce((sum, service) => sum + service.price, 0),
      steps,
      currentStep: seed.currentStep,
      date: seed.date,
      slotStart: seed.slot,
      slotEnd: `${String(Number(seed.slot.slice(0, 2)) + 1).padStart(2, '0')}:${seed.slot.slice(3)}`,
      slotStartAt: new Date(`${seed.date}T${seed.slot}:00`),
      slotEndAt: new Date(`${seed.date}T${String(Number(seed.slot.slice(0, 2)) + 1).padStart(2, '0')}:${seed.slot.slice(3)}:00`),
      status: seed.status,
      paymentStatus: seed.status === 'completed' ? 'paid' : 'unpaid',
      customerNote: seed.status === 'completed' ? 'Squeaking from the front when braking.' : '',
      startedAt: seed.status !== 'pending' ? new Date() : null,
      completedAt: seed.status === 'completed' ? new Date() : null,
      history: [
        { status: 'pending', note: 'Booking request created', changedByRole: 'customer', at: new Date(Date.now() - 86400000) },
        ...(seed.status !== 'pending'
          ? [{ status: 'confirmed', note: 'Booking confirmed', changedByRole: 'station', at: new Date(Date.now() - 43200000) }]
          : []),
        ...(['in_progress', 'completed'].includes(seed.status)
          ? [{ status: 'in_progress', note: 'Work on your vehicle has started', changedByRole: 'station', at: new Date(Date.now() - 7200000) }]
          : []),
        ...(seed.status === 'completed'
          ? [{ status: 'completed', note: 'Service completed. Your vehicle is ready for pickup.', changedByRole: 'station', at: new Date() }]
          : [])
      ]
    })

    await Notification.create({
      recipient: customer._id,
      station: seed.station,
      booking: booking._id,
      channel: 'in_app',
      type: `booking_${seed.status}`,
      title: `Booking ${booking.reference} - ${seed.status.replace('_', ' ')}`,
      body: seed.status === 'completed'
        ? 'Service completed. Your vehicle is ready for pickup.'
        : 'Your booking was updated. Tap to see the latest status.'
    })
  }

  console.log('[seed] 5 bookings created')
const completedBookings = await Booking.find({ status: 'completed' })

  for (const booking of completedBookings) {
    if (booking.vehicle) {
      await Vehicle.findByIdAndUpdate(booking.vehicle, {
        $set: { lastServiceDate: booking.completedAt || booking.date },
        $inc: { serviceCount: 1 }
      })
    }

    const seed = bookingSeed.find((item) => item.date === booking.date && item.station.equals(booking.station))
    if (!seed?.review) continue

    await Review.create({
        booking: booking._id,
        station: booking.station,
        customer: customer._id,
        vehicle: booking.vehicle,
        ...seed.review
      })
  }

  console.log(`[seed] ${completedBookings.length} reviews created`)

  for (const entry of stations) {
    await Review.refreshStationRating(entry.station._id)
  }
  console.log('[seed] station ratings recalculated from real reviews')

  console.log('\n=== Demo accounts (password for all: password123) ===')
  console.log('Customer : customer@autocare.lk')
  console.log('Station  : cityauto@autocare.lk')
  console.log('Station  : expresslube@autocare.lk')
  console.log('Station  : premiumbody@autocare.lk')

  await mongoose.disconnect()
}

run().catch((error) => {
  console.error('[seed] failed', error)
  process.exit(1)
})