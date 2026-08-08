import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import adminCssHref from '../styles/admin.css?url';
import { useStylesheets } from '../utils/useStylesheets.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useAdminNotifications } from '../hooks/useAdminNotifications.js';
import { Sidebar } from '../components/admin/Sidebar.jsx';
import { TopHeader } from '../components/admin/Header.jsx';

export function AdminLayout() {
  useStylesheets([adminCssHref]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const notifications = useAdminNotifications(user?.role === 'admin');

  return (
    <div className="admin-container">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <main className="main-content">
        <TopHeader onToggleSidebar={() => setSidebarOpen((v) => !v)} notifications={notifications} />
        <div className="content-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
