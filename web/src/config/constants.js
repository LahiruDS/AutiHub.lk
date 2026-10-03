/**
 * Edit everything brand / label related here. No component hardcodes these values,
 * so changing text, colours or a new service step means editing only this file.
 */

export const APP = {
  name: 'AutoCare',
  tagline: 'Book car service. Track it live.',
  currency: 'LKR',
  supportPhone: '011 234 5678',
  supportEmail: 'help@autocare.lk'
}

export const BOOKING = {
  statuses: {
    pending: { label: 'Pending', tone: 'amber' },
    confirmed: { label: 'Confirmed', tone: 'blue' },
    in_progress: { label: 'In progress', tone: 'cyan' },
    on_hold: { label: 'On hold', tone: 'amber' },
    completed: { label: 'Completed', tone: 'green' },
    cancelled: { label: 'Cancelled', tone: 'red' },
    no_show: { label: 'No show', tone: 'red' }
  },

  // Order the customer sees in the live progress timeline.
  flow: [
    'pending',
    'confirmed',
    'in_progress',
    'completed'
  ],

  liveStatuses: ['pending', 'confirmed', 'in_progress', 'on_hold'],

  // How often the tracking page refetches. Lower = more live, more requests.
  pollIntervalMs: 4000
}

export const WORKFLOW_STEPS = {
  received: 'Vehicle received',
  inspection: 'Initial inspection',
  oil_filter: 'Oil & filter change',
  brakes: 'Brake system check',
  tyres: 'Tyre service',
  body_work: 'Body work',
  quality_check: 'Quality check',
  ready: 'Ready for pickup'
}

export const SERVICE_CATEGORIES = {
  routine: 'Routine service',
  repair: 'Repair',
  diagnostics: 'Diagnostics',
  bodywork: 'Body work',
  tyres: 'Tyres',
  inspection: 'Inspection',
  other: 'Other'
}

export const VEHICLE = {
  fuelTypes: {
    petrol: 'Petrol',
    diesel: 'Diesel',
    hybrid: 'Hybrid',
    ev: 'Electric',
    lpg: 'LPG',
    cng: 'CNG'
  },
  transmissions: { manual: 'Manual', automatic: 'Automatic' }
}

export const STATION_STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

export const CUSTOMER_STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

export const formatMoney = (value) =>
  `${APP.currency} ${Number(value || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '-'
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', ...options })
}

export const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const timeAgo = (value) => {
  if (!value) return ''
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDateTime(value)
}