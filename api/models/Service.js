import mongoose from 'mongoose'

export const SERVICE_CATEGORIES = [
  'routine',
  'repair',
  'diagnostics',
  'bodywork',
  'tyres',
  'inspection',
  'other'
]

const serviceSchema = new mongoose.Schema(
  {
    station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true, index: true },

    name: { type: String, required: [true, 'Service name is required'], trim: true },
    description: { type: String, default: '' },
    category: { type: String, enum: SERVICE_CATEGORIES, default: 'routine' },

    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    priceUnit: { type: String, default: 'service' },

    durationMinutes: { type: Number, default: 60, min: 15 },

    // Which workflow steps this service triggers on the station profile.
    steps: { type: [String], default: [] },

    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
)

serviceSchema.index({ name: 'text', description: 'text' })

export const Service = mongoose.model('Service', serviceSchema)
export default Service