import 'dotenv/config'

const required = (key, fallback = null) => {
  const value = process.env[key] ?? fallback
  if (value === null) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 5000),

  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/car_service_platform'),

  jwt: {
    secret: required('JWT_SECRET', 'dev-only-change-this-secret'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  corsOrigins: (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  // Default working hours per weekday. A station can override this in its profile.
  stationHours: {
    openHour: Number(process.env.OPEN_HOUR || 8),
    closeHour: Number(process.env.CLOSE_HOUR || 18),
    slotMinutes: Number(process.env.SLOT_MINUTES || 60)
  },

  // Max lead time (in days) a customer can book ahead.
  bookingWindowDays: Number(process.env.BOOKING_WINDOW_DAYS || 30),

  notifications: {
    fromEmail: process.env.SMTP_FROM || 'AutoCare <no-reply@autocare.example>',
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: Number(process.env.SMTP_PORT || 587),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    },
    // SMS goes through a simple webhook so any provider (Twilio, Msg91, Dialog) can be plugged in.
    smsWebhookUrl: process.env.SMS_WEBHOOK_URL || '',
    smsApiKey: process.env.SMS_API_KEY || ''
  }
}

export default config