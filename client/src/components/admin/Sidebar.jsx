import { NavLink } from 'react-router-dom';
import { ADMIN_NAV_ITEMS } from './navItems.js';
import { useAuth } from '../../context/AuthContext.jsx';

export function Sidebar({ open, onNavigate }) {
  const { logout } = useAuth();

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`} id="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <i className="fas fa-leaf" />
          </div>
          <div className="logo-text">
            <span className="brand-name">PROFETAS</span>
            <span className="brand-sub">FARM</span>
            <span className="portal-tag">ADMIN PORTAL</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {ADMIN_NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={({ isActive }) => (isActive ? 'active' : '')} onClick={onNavigate}>
                <i className={`fas ${item.icon}`} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="logout-btn" onClick={logout}>
          <i className="fas fa-sign-out-alt" />
          <span>Logout</span>
        </button>
        <div className="sidebar-bottom-info">
          <i className="fas fa-leaf small-leaf" />
          <div className="info-text">
            <p className="farm-name">Profetas Farm</p>
            <p className="farm-tag">Premium Quality, Naturally Grown</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
