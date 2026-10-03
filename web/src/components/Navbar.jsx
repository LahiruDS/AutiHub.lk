import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { APP } from '../config/constants.js'

export const Navbar = () => {
  const { user, station, logout, unreadCount } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const headerRef = useRef(null)

  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const handleLogout = () => {
    logout()
    close()
    navigate('/')
  }

  const customerLinks = [
    { to: '/', label: 'Home' },
    { to: '/stations', label: 'Find a station' },
    { to: '/bookings', label: 'My bookings' },
    { to: '/vehicles', label: 'My garage' },
    { to: '/notifications', label: 'Notifications' }
  ]

  const stationLinks = [
    { to: '/station/dashboard', label: 'Dashboard' },
    { to: '/station/bookings', label: 'Bookings' },
    { to: '/station/services', label: 'Services & pricing' },
    { to: '/station/reviews', label: 'Reviews' },
    { to: '/station/profile', label: 'Profile' }
  ]

  const links = user?.role === 'station' ? stationLinks : user?.role === 'customer' ? customerLinks : []

  return (
    <header className="nav" ref={headerRef}>
      <div className="container nav-inner">
        <Link to="/" className="logo-link" onClick={close}>
          <img src="/Img.png" alt={APP.name} className="logo-img" />
        </Link>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={close}
            >
              {link.label}
              {link.to === '/notifications' && unreadCount > 0 && (
                <span className="badge badge-red tiny" style={{ marginLeft: 6 }}>
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}

          {!user && (
            <>
              <NavLink to="/stations" className="nav-link" onClick={close}>
                Browse stations
              </NavLink>
              <NavLink to="/login" className="nav-link" onClick={close}>
                Log in
              </NavLink>
              <Link to="/register" className="btn btn-sm nav-cta" onClick={close}>
                Book now
              </Link>
            </>
          )}

          {user && (
            <div className="nav-user">
              <div className="nav-profile" aria-label={`${user.name} profile`}>
                <span className="nav-profile-avatar">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
                <span className="nav-user-name muted">
                  {user.name}
                  {station ? ` - ${station.name}` : ''}
                </span>
              </div>
              <button type="button" className="btn btn-sm btn-ghost nav-logout" onClick={handleLogout}>
                Log out
              </button>
            </div>
          )}
        </nav>

        <div className="menu-toggle-wrap">
          <button
            type="button"
            className="nav-toggle"
            aria-label="Toggle menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar