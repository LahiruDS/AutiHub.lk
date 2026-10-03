export const Spinner = ({ label = 'Loading...' }) => (
  <div className="center" style={{ padding: '40px 20px' }}>
    <div
      style={{
        width: 30,
        height: 30,
        border: '3px solid var(--line)',
        borderTopColor: 'var(--brand)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        margin: '0 auto 12px'
      }}
    />
    <p className="muted small">{label}</p>
    <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
  </div>
)

export const EmptyState = ({ icon = '📭', title, message, action }) => (
  <div className="empty">
    <div className="empty-icon">{icon}</div>
    <h3>{title}</h3>
    {message && <p className="muted small" style={{ marginTop: 6 }}>{message}</p>}
    {action && <div style={{ marginTop: 18 }}>{action}</div>}
  </div>
)

export const CardSkeleton = ({ count = 3 }) => (
  <div className="grid grid-3">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="skeleton" style={{ height: 190 }} />
    ))}
  </div>
)

export default Spinner