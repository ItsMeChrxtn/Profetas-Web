export function StatCard({ icon, iconColor = 'green', label, value, trend }) {
  return (
    <div className="stat-card">
      {icon && (
        <div className={`stat-icon-wrapper ${iconColor}`}>
          <i className={`fas ${icon}`} />
        </div>
      )}
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {trend && (
        <div className="stat-trend">
          <span className="trend-label">{trend}</span>
        </div>
      )}
    </div>
  );
}
