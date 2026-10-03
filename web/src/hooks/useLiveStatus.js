import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api.js'
import { BOOKING } from '../config/constants.js'

/**
 * Live booking status via polling.
 *
 * Swap this one hook for a WebSocket/SSE version later and every screen that
 * shows live progress keeps working, because nothing else fetches the status.
 *
 * @param bookingId  id or reference to follow
 * @param options.active      stop polling (saves requests on finished bookings)
 * @param options.intervalMs  override BOOKING.pollIntervalMs
 */
export const useLiveStatus = (bookingId, { active = true, intervalMs = BOOKING.pollIntervalMs } = {}) => {
  const [booking, setBooking] = useState(null)
  const [canReview, setCanReview] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(bookingId))
  const [updatedAt, setUpdatedAt] = useState(null)

  const statusRef = useRef(null)
  const lastJson = useRef('')

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!bookingId) return null

      if (!silent) setLoading(true)

      try {
        const data = await api.get(`/bookings/${bookingId}`)
        const json = JSON.stringify(data.booking)

        if (json !== lastJson.current) {
          lastJson.current = json
          setBooking(data.booking)
          setUpdatedAt(new Date())
        }

        setCanReview(Boolean(data.canReview))
        statusRef.current = data.booking.status
        setError('')
        return data.booking
      } catch (err) {
        if (!silent) setError(err.message)
        return null
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [bookingId]
  )

  useEffect(() => {
    if (!bookingId) {
      setBooking(null)
      setLoading(false)
      return
    }

    load()
  }, [bookingId, load])

  useEffect(() => {
    if (!bookingId || !active) return

    const timer = setInterval(() => load({ silent: true }), intervalMs)

    const onFocus = () => load({ silent: true })
    window.addEventListener('focus', onFocus)

    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [bookingId, active, intervalMs, load])

  const isLive = booking ? BOOKING.liveStatuses.includes(booking.status) : false

  return {
    booking,
    canReview,
    error,
    loading,
    updatedAt,
    isLive,
    refresh: () => load({ silent: true })
  }
}

export default useLiveStatus