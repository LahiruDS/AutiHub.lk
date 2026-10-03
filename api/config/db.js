import mongoose from 'mongoose'
import config from '../config/env.js'

let cachedConnection = null

export const connectDB = async () => {
  if (cachedConnection) return cachedConnection

  mongoose.set('strictQuery', true)
  const connection = await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 10000
  })

  cachedConnection = connection
  console.log(`[db] connected -> ${connection.connection.host}/${connection.connection.name}`)
  return connection
}

export const disconnectDB = async () => {
  if (cachedConnection) {
    await mongoose.disconnect()
    cachedConnection = null
  }
}

export default connectDB