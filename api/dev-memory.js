/**
 * Dev entry point that boots an in-memory MongoDB, runs the seed data, then
 * starts the API. Use `npm start` for the real server.
 */
import { startMemoryDB } from './utils/memoryDb.js'

const { uri } = await startMemoryDB()

process.env.MONGO_URI = uri
process.env.JWT_SECRET ||= 'dev-memory-secret'
process.env.SMTP_HOST ||= ''
process.env.SMS_WEBHOOK_URL ||= ''

const { default: app } = await import('./index.js')
const config = (await import('./config/env.js')).default
const connectDB = (await import('./config/db.js')).default

await connectDB()

const { spawn } = await import('node:child_process')
const seed = spawn(process.execPath, ['seed.js'], { stdio: 'inherit', env: process.env })
await new Promise((resolve) => seed.on('exit', resolve))

app.listen(config.port, () => {
  console.log(`\n[api] ready on http://localhost:${config.port}/api/health`)
  console.log('[api] demo login password for every seeded account: password123')
})

process.on('SIGINT', async () => {
  console.log('\n[dev] shutting down')
  await (await import('./config/db.js')).disconnectDB()
  process.exit(0)
})