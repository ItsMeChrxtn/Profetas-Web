// admin.css only defines 3 status-pill color buckets (green/amber/red) shared
// across several literal status values. Everything outside those buckets
// (Confirmed, Cancelled, Rejected, Verified, Paid) was styled with an inline
// override in the original PHP (admin_status_style()) - replicated here
// verbatim rather than adding new CSS classes, to keep admin.css untouched.
const CSS_CLASS_BY_STATUS = {
  Completed: 'status-completed',
  Active: 'status-completed',
  'In Stock': 'status-completed',
  Processing: 'status-processing',
  Shipped: 'status-processing',
  'Low Stock': 'status-processing',
  Pending: 'status-pending',
  'Out of Stock': 'status-pending',
};

const INLINE_STYLE_BY_STATUS = {
  Confirmed: { background: '#DBEAFE', color: '#1E40AF' },
  Cancelled: { background: 'var(--danger-bg)', color: 'var(--danger-text)' },
  Rejected: { background: 'var(--danger-bg)', color: 'var(--danger-text)' },
  Verified: { background: 'var(--success-bg)', color: 'var(--success-text)' },
  Paid: { background: 'var(--success-bg)', color: 'var(--success-text)' },
};

export function AdminStatusPill({ status }) {
  const className = CSS_CLASS_BY_STATUS[status];
  if (className) {
    return <span className={`status-pill ${className}`}>{status}</span>;
  }
  return (
    <span className="status-pill" style={INLINE_STYLE_BY_STATUS[status] || {}}>
      {status}
    </span>
  );
}
