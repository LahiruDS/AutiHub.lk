import mongoose from 'mongoose'

// Every step in the service workflow. `key` is what the code uses, `label` is what users see.
export const SERVICE_STEP_KEYS = [
  'received',
  'inspection',
  'oil_filter',
  'brakes',
  'tyres',
  'body_work',
  'quality_check',
  'ready'
]

const serviceStepSchema = new mongoose.Schema(
  {
    key: { type: String, enum: SERVICE_STEP_KEYS, required: true },
    label: { type: String, required: true },
    durationMinutes: { type: Number, default: 20 },
    active: { type: Boolean, default: true }
  },
  { _id: false }
)

const workingHoursSchema = new mongoose.Schema(
  {
    // 0 = Sunday ... 6 = Saturday
    day: { type: Number, min: 0, max: 6, required: true },
    open: { type: String, default: '08:00' },
    close: { type: String, default: '18:00' },
    isClosed: { type: Boolean, default: false }
  },
  { _id: false }
)

const stationSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Station name is required'], trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },

    address: {
      line1: { type: String, default: '' },
      city: { type: String, default: '' },
      district: { type: String, default: '' }
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
    },

    logoUrl: { type: String, default: '' },
    images: { type: [String], default: [] },

    services: [serviceStepSchema],
    workingHours: { type: [workingHoursSchema], default: [] },

    bayCount: { type: Number, default: 2, min: 1 },
    slotMinutes: { type: Number, default: 60 },

    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 }
    },

    isApproved: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
)

stationSchema.index({ location: '2dsphere' })
stationSchema.index({ 'address.city': 1 })
stationSchema.index({ 'rating.average': -1 })

stationSchema.virtual('fullAddress').get(function fullAddress () {
  return [this.address.line1, this.address.city, this.address.district].filter(Boolean).join(', ')
})

export const Station = mongoose.model('Station', stationSchema)
export default Station