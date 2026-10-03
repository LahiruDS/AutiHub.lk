import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const chunk = (array, size) => {
  const out = []
  for (let index = 0; index < array.length; index += size) out.push(array.slice(index, index + size))
  return out
}

const parts = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`)
  return {
    day: date.getDate(),
    weekday: WEEKDAY[date.getDay()],
    month: MONTH[date.getMonth()],
    isWeekend: [0, 6].includes(date.getDay())
  }
}

/**
 * Two-part picker: a horizontal date strip then the free slots for that date.
 * Both are driven by the API so real availability is always shown.
 */
export const SlotPicker = ({ stationId, value, onChange, disabled = false }) => {
  const [dates, setDates] = useState([])
  const [date, setDate] = useState(value?.date || null)
  const [slots, setSlots] = useState([])
  const [loadingDates, setLoadingDates] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!stationId) return

    let cancelled = false
    setLoadingDates(true)

    api
      .get('/bookings/dates', { params: { stationId } })
      .then((data) => {
        if (cancelled) return
        const openDates = (data.dates || []).filter((item) => item.slotCount > 0).map((item) => item.date)
        setDates(openDates)
        setDate((current) => current || openDates[0] || null)
        setError(openDates.length ? '' : 'This station has no open days right now')
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoadingDates(false))

    return () => {
      cancelled = true
    }
  }, [stationId])

  useEffect(() => {
    if (!stationId || !date) return

    let cancelled = false
    setLoadingSlots(true)

    api
      .get('/bookings/slots', { params: { stationId, date } })
      .then((data) => !cancelled && setSlots(data.slots || []))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoadingSlots(false))

    return () => {
      cancelled = true
    }
  }, [stationId, date])

  const weeks = useMemo(() => chunk(dates, 7), [dates])
  const availableCount = slots.filter((slot) => slot.isAvailable).length

  const pick = (dateString) => {
    setDate(dateString)
    onChange?.({ ...(value || {}), date: dateString, slotStart: null, slotEnd: null })
  }

  const pickSlot = (slot) => {
    onChange?.({
      date,
      slotStart: slot.start,
      slotEnd: slot.end,
      slotMinutes: toMinutes(slot.end) - toMinutes(slot.start)
    })
  }

  if (loadingDates) return <div className="skeleton" style={{ height: 92 }} />

  if (error && !dates.length) {
    return <div className="alert alert-warn">{error}</div>
  }

  return (
    <div>
      <div className="date-strip">
        {dates.slice(0, 21).map((dateString) => {
          const { day, weekday, month, isWeekend } = parts(dateString)
          return (
            <button
              key={dateString}
              type="button"
              className={`date-chip ${date === dateString ? 'selected' : ''}`}
              onClick={() => pick(dateString)}
              disabled={disabled}
            >
              <span>{weekday}{isWeekend ? '*' : ''}</span>
              <b>{day}</b>
              <span>{month}</span>
            </button>
          )
        })}
      </div>

      {loadingSlots ? (
        <div className="skeleton" style={{ height: 118, marginTop: 6 }} />
      ) : availableCount === 0 ? (
        <div className="alert alert-warn">No free slots on this date. Please pick another day.</div>
      ) : (
        <>
          <p className="small muted" style={{ marginBottom: 10 }}>
            {availableCount} slot{availableCount === 1 ? '' : 's'} available
          </p>
          <div className="slot-grid">
            {slots.map((slot) => (
              <button
                key={slot.start}
                type="button"
                className={`slot ${value?.slotStart === slot.start ? 'selected' : ''}`}
                disabled={!slot.isAvailable || disabled}
                onClick={() => pickSlot(slot)}
                title={slot.isAvailable ? 'Available' : slot.isBooked ? 'Already booked' : 'Time has passed'}
              >
                {slot.start}
                <small>{slot.isAvailable ? slot.end : slot.isBooked ? 'booked' : 'passed'}</small>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const toMinutes = (time) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export default SlotPicker