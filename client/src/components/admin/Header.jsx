import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ADMIN_NAV_ITEMS } from './navItems.js';
import { formatDateTime } from '../../utils/dateFormat.js';

const emptyNotifications = { notifications: [], unreadCount: 0, markAllRead: () => {} };

export function TopHeader({ onToggleSidebar, notifications = emptyNotifications }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { notifications: adminNotifications, unreadCount, markAllRead } = notifications;

  const name = user ? `${user.firstName} ${user.lastName}` : 'Admin';
  const current = ADMIN_NAV_ITEMS.find((item) => location.pathname.startsWith(item.to));
  const isDashboard = current?.to === '/admin/dashboard';

  function toggleNotif() {
    const opening = !notifOpen;
    setNotifOpen(opening);
    if (opening) markAllRead();
  }

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
          <button className="icon-btn" onClick={toggleNotif}>
            <i className="far fa-bell" />
            {unreadCount > 0 && <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          {notifOpen && (
            <div className="dropdown-menu notif-menu" style={{ display: 'block' }}>
              <div className="dropdown-header">Notifications</div>
              <div className="dropdown-body">
                {adminNotifications.length === 0 ? (
                  <div className="dropdown-empty">
                    <i className="far fa-bell-slash" />
                    No new notifications
                  </div>
                ) : (
                  adminNotifications.map((n) => (
                    <Link key={n.id} to={n.href} onClick={() => setNotifOpen(false)}>
                      <span className="notif-icon" style={{ background: n.bg, color: n.color }}>
                        <i className={`fas ${n.icon}`} />
                      </span>
                      <span className="notif-text">
                        {n.text}
                        <span className="notif-time">{formatDateTime(n.receivedAt)}</span>
                      </span>
                    </Link>
                  ))
                )}
              </div>
              <div className="dropdown-footer">
                <Link to="/admin/orders" onClick={() => setNotifOpen(false)}>
                  View all
                </Link>
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
