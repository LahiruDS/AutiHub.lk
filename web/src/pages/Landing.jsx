import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { APP } from '../config/constants.js'

const FEATURES = [
  { icon: '🔍', title: 'Compare stations', text: 'See prices, ratings and available slots before you decide where to go.' },
  { icon: '🗓️', title: 'Pick your own slot', text: 'Live availability means the slot you pick is genuinely free.' },
  { icon: '📡', title: 'Track it live', text: 'Watch each service step update as the work happens in the garage.' },
  { icon: '🚗', title: 'Keep your garage', text: 'Save all your vehicles once and book any of them in two clicks.' },
  { icon: '🔔', title: 'Instant updates', text: 'Email and SMS alerts the moment your booking is confirmed or ready.' },
  { icon: '⭐', title: 'Real reviews', text: 'Only customers who actually completed a service can leave a review.' }
]

export const Landing = () => {
  const { user } = useAuth()

  const primaryTo = user?.role === 'station' ? '/station/dashboard' : user ? '/stations' : '/register'
  const primaryLabel = user?.role === 'station' ? 'Open dashboard' : user ? 'Find a station' : 'Get started'

  return (
    <>
      <section className="hero">
        <div className="container hero-layout">
          <div className="hero-copy">
            <span className="hero-badge">Trusted by drivers across Sri Lanka</span>
            <h1>{APP.tagline}</h1>
            <p>
              Find a trusted service station, choose a time that suits you, and follow the whole job
              from first check to pickup. No phone calls, no waiting for a reply.
            </p>

            <div className="hero-badges" aria-label="Key benefits">
              <span>Same-day slots</span>
              <span>Live progress</span>
              <span>Verified garages only</span>
            </div>

            <div className="hero-actions">
              <Link to={primaryTo} className="btn btn-lg hero-primary-btn">{primaryLabel}</Link>
              {!user && <Link to="/register/station" className="btn btn-outline btn-lg">I run a service station</Link>}
            </div>

            <div className="hero-stats">
              <div className="hero-stat"><b>24/7</b><span>Booking open</span></div>
              <div className="hero-stat"><b>Live</b><span>Progress tracking</span></div>
              <div className="hero-stat"><b>Instant</b><span>Email & SMS alerts</span></div>
            </div>
          </div>

          <div className="hero-visual" aria-label="Service scheduling overview">
            <div className="visual-card">
              <div className="visual-header">
                <div className="visual-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <span className="visual-label">AutoCare</span>
              </div>

              <div className="service-pill">Next service: 9:00 AM</div>

              <div className="car-card">
                <div className="car-card-top">
                  <span className="car-name">Toyota Prius</span>
                  <span className="status-chip">Ready</span>
                </div>
                <div className="car-progress">
                  <span className="progress-bar" />
                </div>
                <div className="car-meta">
                  <span>Oil change</span>
                  <span>2 of 3 steps</span>
                </div>
              </div>

              <div className="visual-row">
                <div className="mini-stat">
                  <strong>4.9/5</strong>
                  <span>Average rating</span>
                </div>
                <div className="mini-stat">
                  <strong>1,240</strong>
                  <span>Happy drivers</span>
                </div>
              </div>
            </div>

            <div className="floating-badge badge-top">Live updates</div>
            <div className="floating-badge badge-bottom">+2,400 bookings</div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="section-heading">
            <h2>Everything you need in one place</h2>
            <p className="muted">
              Our platform brings together only verified garages and service stations, so you can book with confidence.
            </p>
          </div>

          <div className="grid grid-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="card feature">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container why-choose">
        <div className="card feature-panel">
          <div className="grid grid-2" style={{ alignItems: 'center' }}>
            <div>
              <h2>Own a service station?</h2>
              <p className="muted" style={{ marginTop: 10 }}>
                List your station, set your prices and working hours, and let customers book the slots
                you actually have free. You update each job step and customers see it instantly.
              </p>
              <Link to={user?.role === 'station' ? '/station/dashboard' : '/register/station'} className="btn" style={{ marginTop: 18 }}>
                Register your station
              </Link>
            </div>
            <div className="stack">
              <div className="alert alert-info" style={{ marginBottom: 0 }}>
                <b>Pending</b> → customer booking request arrives
              </div>
              <div className="alert alert-info" style={{ marginBottom: 0 }}>
                <b>In progress</b> → customer watches each step live
              </div>
              <div className="alert alert-ok" style={{ marginBottom: 0 }}>
                <b>Completed</b> → pickup SMS and review request
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo" aria-label={APP.name}>
              <img src="/img2.png" alt={APP.name} className="footer-logo-img" />
            </Link>
            <p className="small footer-copy">{APP.tagline}</p>
            <p className="small footer-copy">
              Book trusted car care in minutes, track every repair step in real time, and keep your service history in one place.
            </p>
          </div>

          <div>
            <h4>For customers</h4>
            <p className="small"><Link to="/stations">Find a station</Link></p>
            <p className="small"><Link to="/vehicles">My garage</Link></p>
            <p className="small"><Link to="/bookings">My bookings</Link></p>
            <p className="small"><Link to="/register">Create an account</Link></p>
          </div>

          <div>
            <h4>For stations</h4>
            <p className="small"><Link to="/register/station">Register your garage</Link></p>
            <p className="small"><Link to="/login">Station login</Link></p>
            <p className="small"><Link to="/station/dashboard">Manage bookings</Link></p>
            <p className="small"><Link to="/station/services">Services & pricing</Link></p>
          </div>

          <div>
            <h4>Support</h4>
            <p className="small"><a href={`tel:${APP.supportPhone}`}>{APP.supportPhone}</a></p>
            <p className="small"><a href={`mailto:${APP.supportEmail}`}>{APP.supportEmail}</a></p>
            <p className="small">Mon - Sat: 8:00 AM - 8:00 PM</p>
            <p className="small">No. 72, Akuressa Rd, Matara, Sri Lanka</p>
          </div>
        </div>

        <div className="container footer-bottom">
          <p className="small">© 2026 {APP.name}. All rights reserved. Developed By Lahiru De Silva.</p>
          <div className="footer-socials">
            <a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook</a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://wa.me/94771234567" target="_blank" rel="noreferrer">WhatsApp</a>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Landing