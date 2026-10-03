import Notification from '../models/Notification.js'
import { ApiError, asyncHandler } from '../middleware/error.js'

export const listNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query

  const filter = { recipient: req.user._id, channel: 'in_app' }
  if (unreadOnly === 'true') filter.status = { $ne: 'read' }

  const perPage = Math.min(Number(limit) || 20, 50)
  const skip = (Math.max(Number(page) || 1, 1) - 1) * perPage

  const [notifications, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, channel: 'in_app', status: { $ne: 'read' } })
  ])

  res.json({
    total,
    unread,
    page: Number(page) || 1,
    pages: Math.ceil(total / perPage),
    notifications: notifications.map((item) => ({
      id: item._id,
      type: item.type,
      title: item.title,
      body: item.body,
      booking: item.booking,
      station: item.station,
      status: item.status,
      read: item.status === 'read',
      createdAt: item.createdAt
    }))
  })
})

export const markRead = asyncHandler(async (req, res) => {
  const filter = { recipient: req.user._id }
  if (req.params.id) filter._id = req.params.id

  await Notification.updateMany(filter, { status: 'read' })
  res.json({ message: 'Marked as read' })
})

export const removeNotification = asyncHandler(async (req, res) => {
  const deleted = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id })
  if (!deleted) throw new ApiError(404, 'Notification not found')
  res.json({ message: 'Removed' })
})