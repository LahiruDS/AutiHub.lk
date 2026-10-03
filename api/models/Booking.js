import mongoose from 'mongoose'

export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled',
  'no_show'
]

export const PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'refunded']

// Append-only audit trail. This array is what the customer sees as "live progress".
const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: BOOKING_STATUSES, required: true },
    note: { type: String, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    changedByRole: { type: String, default: 'system' },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
)

const bookingItemSchema = new mongoose.Schema(
  {
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, default: 60 }
  },
  { _id: false }
)

const bookingSchema = new mongoose.Schema(
  {
    reference: { type: String, unique: true, index: true },

    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true, index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },

    items: { type: [bookingItemSchema], default: [] },
    totalPrice: { type: Number, default: 0, min: 0 },

    // Which workflow steps are actually being performed on this job.
    steps: { type: [String], default: [] },
    currentStep: { type: String, default: null },

    date: { type: String, required: true }, // YYYY-MM-DD
    slotStart: { type: String, required: true }, // HH:mm
    slotEnd: { type: String, required: true },
    slotStartAt: { type: Date, required: true },
    slotEndAt: { type: Date, required: true },

    status: { type: String, enum: BOOKING_STATUSES, default: 'pending', index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'unpaid' },

    customerNote: { type: String, default: '' },
    stationNote: { type: String, default: '' },

    history: { type: [historySchema], default: [] },

    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
)

bookingSchema.index({ station: 1, date: 1, slotStart: 1, status: 1 })

bookingSchema.pre('validate', function generateReference (next) {
  if (!this.reference) {
    const stamp = Date.now().toString(36).toUpperCase()
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
    this.reference = `AC-${stamp}-${rand}`
  }
  next()
})

bookingSchema.methods.toPublicJSON = function toPublicJSON (currentStepLabel = null) {
  return {
    id: this._id,
    reference: this.reference,
    station: this.station,
    vehicle: this.vehicle,
    items: this.items,
    totalPrice: this.totalPrice,
    steps: this.steps,
    currentStep: this.currentStep,
    currentStepLabel,
    date: this.date,
    slotStart: this.slotStart,
    slotEnd: this.slotEnd,
    status: this.status,
    paymentStatus: this.paymentStatus,
    customerNote: this.customerNote,
    stationNote: this.stationNote,
    history: this.history,
    startedAt: this.startedAt,
    completedAt: this.completedAt,
    createdAt: this.createdAt
  }
}

export const Booking = mongoose.model('Booking', bookingSchema)
export default Booking