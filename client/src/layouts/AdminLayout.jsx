import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import adminCssHref from '../styles/admin.css?url';
import { useStylesheets } from '../utils/useStylesheets.js';
import { Sidebar } from '../components/admin/Sidebar.jsx';
import { TopHeader } from '../components/admin/Header.jsx';

export function AdminLayout() {
  useStylesheets([adminCssHref]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-container">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <main className="main-content">
        <TopHeader onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <div className="content-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
