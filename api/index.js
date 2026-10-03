import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'

import config from './config/env.js'
import connectDB from './config/db.js'
import { notFound, errorHandler } from './middleware/error.js'

import authRoutes from './routes/auth.js'
import stationRoutes from './routes/stations.js'
import serviceRoutes from './routes/services.js'
import bookingRoutes from './routes/bookings.js'
import vehicleRoutes from './routes/vehicles.js'
import reviewRoutes from './routes/reviews.js'
import notificationRoutes from './routes/notifications.js'

export const createApp = () => {
  const app = express()

  app.set('trust proxy', 1)

  app.use(
    cors({
      origin: config.corsOrigins.includes('*') ? true : config.corsOrigins,
      credentials: true
    })
  )
  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())

  if (!config.isProduction) app.use(morgan('dev'))

  app.use(
    '/api/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      message: { message: 'Too many attempts, please try again later' }
    })
  )

  const apiRouters = [
    ['/auth', authRoutes],
    ['/stations', stationRoutes],
    ['/services', serviceRoutes],
    ['/bookings', bookingRoutes],
    ['/vehicles', vehicleRoutes],
    ['/reviews', reviewRoutes],
    ['/notifications', notificationRoutes]
  ]

  app.get(['/api/health', '/health'], (_req, res) => {
    res.json({ status: 'ok', service: 'car-service-platform-api', env: config.env })
  })

  /**
   * The routers are mounted twice on purpose. On Vercel every /api/* request is
   * rewritten to this single function, and depending on how the rewrite resolves
   * the function can receive the path with or without the /api prefix. Mounting
   * both prefixes means the same route table answers either way, and `vercel dev`
   * / local runs behave identically.
   */
  for (const prefix of ['/api', '']) {
    for (const [path, router] of apiRouters) {
      app.use(prefix + path, router)
    }
  }

  app.use(notFound)
  app.use(errorHandler)

  return app
}

export const isServerlessEnvironment = () =>
  Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)

const app = createApp()

/** True only when this file is run directly (`node index.js`), not when imported. */
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isServerlessEnvironment()) {
  connectDB().catch((error) => console.error('[db] initial connect failed', error.message))
} else if (isMainModule) {
  connectDB()
    .then(() => {
      app.listen(config.port, () => {
        console.log(`[api] listening on http://localhost:${config.port}/api/health`)
      })
    })
    .catch((error) => {
      console.error('[api] failed to start', error)
      process.exit(1)
    })
}

export default app