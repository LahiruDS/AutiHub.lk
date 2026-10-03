/**
 * Time slot helpers. All slots are plain "HH:mm" strings so they are easy to
 * store and compare. Change SLOT_MINUTES / OPEN_HOUR / CLOSE_HOUR in .env to
 * reshape every station's schedule at once.
 */
import config from '../config/env.js'

export const toMinutes = (time) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export const toTime = (minutes) => {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0')
  const m = String(minutes % 60).padStart(2, '0')
  return `${h}:${m}`
}

export const getDayOfWeek = (dateString) => new Date(`${dateString}T00:00:00`).getDay()

export const todayString = () => new Date().toISOString().slice(0, 10)

export const isValidDateString = (dateString) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false
  const [y, m, d] = dateString.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

/**
 * Build the list of bookable slots for one station on one date.
 * Station specific workingHours win; otherwise the global config hours are used.
 */
export const buildSlots = ({ date, workingHours = [], slotMinutes }) => {
  const step = Number(slotMinutes) || config.stationHours.slotMinutes
  const day = getDayOfWeek(date)
  const rule = workingHours.find((item) => Number(item.day) === day)

  const open = rule?.open ?? toTime(config.stationHours.openHour * 60)
  const close = rule?.close ?? toTime(config.stationHours.closeHour * 60)

  if (rule?.isClosed) return []

  const start = toMinutes(open)
  const end = toMinutes(close)
  const slots = []

  for (let cursor = start; cursor + step <= end; cursor += step) {
    slots.push({ start: toTime(cursor), end: toTime(cursor + step) })
  }

  return slots
}

/**
 * Marks each slot as "booked" / "free" based on existing bookings.
 * Booked slots stay visible but greyed out so the customer sees the schedule shape.
 */
export const withAvailability = (slots, bookings) => {
  const taken = new Set(
    bookings
      .filter((booking) => !['cancelled', 'no_show'].includes(booking.status))
      .map((booking) => booking.slotStart)
  )

  return slots.map((slot) => ({ ...slot, isBooked: taken.has(slot.start) }))
}

export const isPastSlot = (date, slotStart) => {
  const now = new Date()
  if (date < todayString()) return true
  if (date > todayString()) return false
  return toMinutes(slotStart) <= now.getHours() * 60 + now.getMinutes()
}

export const maxBookableDate = () => {
  const limit = new Date()
  limit.setDate(limit.getDate() + config.bookingWindowDays)
  return limit.toISOString().slice(0, 10)
}