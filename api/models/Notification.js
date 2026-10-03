import mongoose from 'mongoose'

export const NOTIFICATION_CHANNELS = ['email', 'sms', 'in_app']
export const NOTIFICATION_STATUSES = ['queued', 'sent', 'failed', 'read']

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', default: null },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },

    channel: { type: String, enum: NOTIFICATION_CHANNELS, default: 'in_app' },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },

    status: { type: String, enum: NOTIFICATION_STATUSES, default: 'queued' },
    sentAt: { type: Date, default: null },
    error: { type: String, default: '' }
  },
  { timestamps: true }
)

notificationSchema.index({ recipient: 1, createdAt: -1 })

export const Notification = mongoose.model('Notification', notificationSchema)
export default Notification