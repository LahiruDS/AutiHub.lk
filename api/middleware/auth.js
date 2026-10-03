import jwt from 'jsonwebtoken'
import config from '../config/env.js'
import User from '../models/User.js'

export const signToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  })

const readToken = (req) => {
  const header = req.headers.authorization || ''
  if (header.startsWith('Bearer ')) return header.slice(7).trim()
  return req.cookies?.token || null
}

export const authenticate = async (req, res, next) => {
  try {
    const token = readToken(req)
    if (!token) return res.status(401).json({ message: 'Please log in to continue' })

    const payload = jwt.verify(token, config.jwt.secret)
    const user = await User.findById(payload.sub)

    if (!user) return res.status(401).json({ message: 'Account not found' })
    if (!user.isActive) return res.status(403).json({ message: 'Account is disabled' })

    req.user = user
    return next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired, please log in again' })
    }
    return res.status(401).json({ message: 'Invalid session' })
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Please log in to continue' })
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have access to this resource' })
  }
  return next()
}

export const requireStationOwner = async (req, res, next) => {
  try {
    if (req.user.role !== 'station' || !req.user.station) {
      return res.status(403).json({ message: 'Only service stations can do this' })
    }

    const station = await req.user.populate('station')
    if (!station.station) {
      return res.status(403).json({ message: 'Station profile is not linked to this account' })
    }

    req.station = station.station
    return next()
  } catch (error) {
    return next(error)
  }
}