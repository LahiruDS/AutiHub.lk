import { SERVICE_STEP_KEYS } from '../models/Station.js'

export const STEP_LABELS = {
  received: 'Vehicle received',
  inspection: 'Initial inspection',
  oil_filter: 'Oil & filter change',
  brakes: 'Brake system check',
  tyres: 'Tyre service',
  body_work: 'Body work',
  quality_check: 'Quality check',
  ready: 'Ready for pickup'
}

export const STEP_FLOW = SERVICE_STEP_KEYS

export const STATUS_LABELS = {
  pending: 'Waiting for confirmation',
  confirmed: 'Confirmed',
  in_progress: 'Service in progress',
  on_hold: 'On hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show'
}

export const STEP_STATUSES = ['in_progress', 'on_hold', 'completed']

export const isStepStatus = (status) => STEP_STATUSES.includes(status)

export const getStepLabel = (key) => STEP_LABELS[key] || key

/**
 * Given a booking's status, steps list and currentStep, work out the progress
 * percentage the UI can render as a bar. Single source of truth for the
 * "live progress" indicator so the frontend does not need its own logic.
 */
export const progressFor = ({ status, steps = [], currentStep = null }) => {
  if (status === 'completed') return 100
  if (status === 'cancelled' || status === 'no_show') return 0
  if (!steps.length) return status === 'in_progress' ? 50 : 0

  const index = currentStep ? steps.indexOf(currentStep) : -1
  if (index === -1) return 0
  return Math.round(((index + 1) / steps.length) * 100)
}