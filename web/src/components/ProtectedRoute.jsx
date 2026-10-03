import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const FullPageLoader = () => (
  <div className="container page">
    <div className="skeleton" style={{ height: 180, marginBottom: 18 }} />
    <div className="skeleton" style={{ height: 120 }} />
  </div>
)

/**
 * Gate for a page. `roles` limits who can open it.
 * Example: <ProtectedRoute roles={['customer']}><Bookings /></ProtectedRoute>
 */
export const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageLoader />

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="container page">
        <div className="card center">
          <div className="empty-icon">🚫</div>
          <h2>No access</h2>
          <p className="muted">This page is only available for a different account type.</p>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute