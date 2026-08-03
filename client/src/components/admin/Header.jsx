import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ADMIN_NAV_ITEMS } from './navItems.js';

export function TopHeader({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const name = user ? `${user.firstName} ${user.lastName}` : 'Admin';
  const current = ADMIN_NAV_ITEMS.find((item) => location.pathname.startsWith(item.to));
  const isDashboard = current?.to === '/admin/dashboard';

  return (
    <header className="top-header">
      <div className="header-left">
        <button className="mobile-toggle" onClick={onToggleSidebar}>
          <i className="fas fa-bars" />
        </button>
        {!isDashboard && (
          <div className="breadcrumb">
            <Link to="/admin/dashboard">Dashboard</Link>
            <i className="fas fa-chevron-right" />
            <span className="current">{current?.label}</span>
          </div>
        )}
      </div>

      <div className="header-right">
        <div className="header-search">
          <i className="fas fa-search" />
          <input type="text" placeholder="Search..." />
        </div>

        <div className="notification-wrapper">
          <button className="icon-btn" onClick={() => setNotifOpen((v) => !v)}>
            <i className="far fa-bell" />
            <span className="badge">0</span>
          </button>
          {notifOpen && (
            <div className="dropdown-menu" style={{ display: 'block' }}>
              <div className="dropdown-header">Notifications</div>
              <div className="dropdown-body">
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No new notifications</div>
              </div>
              <div className="dropdown-footer">
                <a href="#top">View all</a>
              </div>
            </div>
          )}
        </div>

        <div className="user-profile">
          <div className="profile-info" onClick={() => setProfileOpen((v) => !v)}>
            <div className="avatar">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1B3C26&color=fff`} alt={name} />
            </div>
            <span className="user-name">{name}</span>
            <i className="fas fa-chevron-down" />
          </div>
          {profileOpen && (
            <div className="dropdown-menu" style={{ display: 'block' }}>
              <Link to="/admin/settings" onClick={() => setProfileOpen(false)}>
                <i className="fas fa-user" /> My Profile
              </Link>
              <Link to="/admin/settings" onClick={() => setProfileOpen(false)}>
                <i className="fas fa-cog" /> Settings
              </Link>
              <hr />
              <button type="button" className="text-danger" onClick={() => { setProfileOpen(false); logout(); }}>
                <i className="fas fa-sign-out-alt" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
