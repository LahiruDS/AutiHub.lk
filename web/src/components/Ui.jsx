import { useState } from 'react'
import { formatDate } from '../config/constants.js'

/** Wraps a booking form into ordered steps. Add a step here and it appears. */
export const Stepper = ({ steps, current }) => (
  <div className="stepper">
    {steps.map((label, index) => {
      const state = index < current ? 'done' : index === current ? 'current' : ''
      return (
        <div key={label} style={{ display: 'contents' }}>
          {index > 0 && <div className="stepper-line" />}
          <div className={`stepper-item ${state}`}>
            <div className="stepper-num">{index < current ? '✓' : index + 1}</div>
            <span>{label}</span>
          </div>
        </div>
      )
    })}
  </div>
)

export const DateStrip = ({ items, value, onChange }) => (
  <div className="date-strip">
    {items.map((item) => (
      <button
        key={item.id}
        type="button"
        className={`date-chip ${value === item.id ? 'selected' : ''}`}
        onClick={() => onChange(item.id)}
      >
        <span>{formatDate(item.date, { weekday: 'short' }).split(',')[0]}</span>
        <b>{new Date(`${item.date}T00:00:00`).getDate()}</b>
        <span>{formatDate(item.date, { month: 'short' }).split(' ')[1]}</span>
      </button>
    ))}
  </div>
)

/** 1-5 star input used for reviews. */
export const StarInput = ({ value, onChange, label = 'Rating', readOnly = false }) => {
  const [hover, setHover] = useState(0)
  const shown = hover || value || 0

  return (
    <div className="field">
      <label>{label} {value > 0 && <span className="muted">({value}/5)</span>}</label>
      <div className="star-input" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={star <= shown ? 'on' : ''}
            onMouseEnter={() => !readOnly && setHover(star)}
            onClick={() => !readOnly && onChange(star)}
            disabled={readOnly}
            aria-label={`${star} stars`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

export default Stepper