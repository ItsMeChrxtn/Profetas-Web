export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header-row">
      <div className="page-title-group">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="header-actions">{actions}</div>}
    </div>
  );
}
