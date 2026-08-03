// site.css defines one .status-{value} class per order status - direct 1:1 mapping.
export function StatusPill({ status }) {
  const className = `status-pill status-${status.toLowerCase()}`;
  return <span className={className}>{status}</span>;
}
