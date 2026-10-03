import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, setToken, clearToken, getToken } from '../lib/api.js'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [station, setStation] = useState(null)
  const [loading, setLoading] = useState(Boolean(getToken()))
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setStation(null)
      setLoading(false)
      return null
    }

    try {
      const data = await api.get('/auth/me')
      setUser(data.user)
      setStation(data.station || null)
      return data.user
    } catch {
      clearToken()
      setUser(null)
      setStation(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        const data = await api.get('/auth/notifications/unread-count')
        if (!cancelled) setUnreadCount(data.count || 0)
      } catch {
        /* silent - badge is not critical */
      }
    }

    load()
    const timer = setInterval(load, 30000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [user])

  const login = useCallback(async (credentials) => {
    const data = await api.post('/auth/login', credentials)
    setToken(data.token)
    setUser(data.user)
    setStation(data.station || null)
    return data.user
  }, [])

  const registerCustomer = useCallback(async (payload) => {
    const data = await api.post('/auth/register/customer', payload)
    setToken(data.token)
    setUser(data.user)
    setStation(null)
    return data.user
  }, [])

  const registerStation = useCallback(async (payload) => {
    const data = await api.post('/auth/register/station', payload)
    setToken(data.token)
    setUser(data.user)
    setStation(data.station || null)
    return data.station
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
    setStation(null)
    setUnreadCount(0)
  }, [])

  const value = useMemo(
    () => ({
      user,
      station,
      loading,
      unreadCount,
      setUnreadCount,
      login,
      registerCustomer,
      registerStation,
      logout,
      refresh
    }),
    [user, station, loading, unreadCount, login, registerCustomer, registerStation, logout, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}