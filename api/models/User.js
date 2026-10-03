import mongoose from 'mongoose'

export const USER_ROLES = ['customer', 'station', 'admin']

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: { type: String, required: [true, 'Phone is required'], trim: true },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    role: { type: String, enum: USER_ROLES, default: 'customer' },

    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },

    // Only used when role === 'station'. Points at the owned Station document.
    station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', default: null },

    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
)

userSchema.methods.toPublicJSON = function toPublicJSON () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    isActive: this.isActive,
    station: this.station,
    notifications: this.notifications
  }
}

export const User = mongoose.model('User', userSchema)
export default User