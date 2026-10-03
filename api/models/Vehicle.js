import mongoose from 'mongoose'

const vehicleSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    make: { type: String, required: [true, 'Make is required'], trim: true },
    model: { type: String, required: [true, 'Model is required'], trim: true },
    year: { type: Number, min: 1900, max: 2100 },

    registrationNumber: { type: String, required: true, uppercase: true, trim: true },
    fuelType: { type: String, enum: ['petrol', 'diesel', 'hybrid', 'ev', 'lpg', 'cng'], default: 'petrol' },
    transmission: { type: String, enum: ['manual', 'automatic'], default: 'manual' },

    lastServiceDate: { type: Date, default: null },
    lastServiceOdometer: { type: Number, default: null },
    serviceCount: { type: Number, default: 0 },
    notes: { type: String, default: '' },

    isDefault: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false }
  },
  { timestamps: true }
)

vehicleSchema.index({ owner: 1, registrationNumber: 1 }, { unique: true })

export const Vehicle = mongoose.model('Vehicle', vehicleSchema)
export default Vehicle