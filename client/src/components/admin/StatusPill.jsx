export function AdminStatusPill({ status, style }) {
  const className = `status-${status.toLowerCase().replace(/\s+/g, '')}`;
  return (
    <span className={`status-pill ${className}`} style={style}>
      {status}
    </span>
  );
}
