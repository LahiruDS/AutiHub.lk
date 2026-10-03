/**
 * Local-only helper. Starts a temporary MongoDB so you can run the app without
 * installing MongoDB on your machine.
 *
 *   npm run dev:memory   -> API on :5000 with an in-memory database
 *
 * Production and Vercel ignore this file and use MONGO_URI instead.
 */
import { MongoMemoryServer } from 'mongodb-memory-server'

export const startMemoryDB = async () => {
  const server = await MongoMemoryServer.create({ instance: { dbName: 'car_service_platform' } })
  const uri = server.getUri()
  console.log(`[memory-db] started at ${uri}`)
  return { server, uri }
}

export default startMemoryDB