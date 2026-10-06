import { NavLink, useLocation } from 'react-router-dom';
import { ADMIN_NAV_ITEMS } from './navItems.js';
import { useAuth } from '../../context/AuthContext.jsx';

export function Sidebar({ open, onNavigate }) {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`} id="sidebar">
      <div className="sidebar-header">
        <div className="logo logo-stacked">
          <div className="logo-badge">
            <img src="/logo.png" alt="Profeta Integrated Farm" className="logo-full-img" />
          </div>
          <span className="portal-tag">ADMIN PORTAL</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {ADMIN_NAV_ITEMS.map((item) => (
            // admin.css targets `.sidebar-nav li.active a`, not the anchor itself,
            // so the active class has to live on the <li> - NavLink's className
            // callback only ever sets it on the <a> it renders.
            <li key={item.to} className={location.pathname.startsWith(item.to) ? 'active' : ''}>
              <NavLink to={item.to} onClick={onNavigate}>
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
