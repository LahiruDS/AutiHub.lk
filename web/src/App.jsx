import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'

import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import RegisterCustomer from './pages/RegisterCustomer.jsx'
import RegisterStation from './pages/RegisterStation.jsx'

import Stations from './pages/Stations.jsx'
import StationDetail from './pages/StationDetail.jsx'
import BookService from './pages/BookService.jsx'

import MyBookings from './pages/MyBookings.jsx'
import TrackBooking from './pages/TrackBooking.jsx'
import MyVehicles from './pages/MyVehicles.jsx'
import Notifications from './pages/Notifications.jsx'

import StationDashboard from './pages/station/StationDashboard.jsx'
import StationBookings from './pages/station/StationBookings.jsx'
import StationBookingManage from './pages/station/StationBookingManage.jsx'
import StationServices from './pages/station/StationServices.jsx'
import StationReviews from './pages/station/StationReviews.jsx'
import StationProfile from './pages/station/StationProfile.jsx'

const NotFound = () => (
  <div className="container page">
    <div className="card center">
      <div className="empty-icon">🛠️</div>
      <h1>Page not found</h1>
      <p className="muted" style={{ marginTop: 8 }}>The page you are looking for does not exist.</p>
      <a href="/" className="btn" style={{ marginTop: 20 }}>Go home</a>
    </div>
  </div>
)

export const App = () => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterCustomer />} />
          <Route path="/register/station" element={<RegisterStation />} />

          <Route path="/stations" element={<Stations />} />
          <Route path="/stations/:idOrSlug" element={<StationDetail />} />

          <Route
            path="/book/:idOrSlug"
            element={
              <ProtectedRoute roles={['customer']}>
                <BookService />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bookings"
            element={
              <ProtectedRoute roles={['customer']}>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings/:id"
            element={
              <ProtectedRoute>
                <TrackBooking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vehicles"
            element={
              <ProtectedRoute roles={['customer']}>
                <MyVehicles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/station/dashboard"
            element={
              <ProtectedRoute roles={['station']}>
                <StationDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/station/bookings"
            element={
              <ProtectedRoute roles={['station']}>
                <StationBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/station/bookings/:id"
            element={
              <ProtectedRoute roles={['station']}>
                <StationBookingManage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/station/services"
            element={
              <ProtectedRoute roles={['station']}>
                <StationServices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/station/reviews"
            element={
              <ProtectedRoute roles={['station']}>
                <StationReviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/station/profile"
            element={
              <ProtectedRoute roles={['station']}>
                <StationProfile />
              </ProtectedRoute>
            }
          />

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
)

export default App