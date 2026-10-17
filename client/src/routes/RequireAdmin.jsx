import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { isAdmin, isSuperAdmin } from '../utils/roles.js';

export function RequireAdmin() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin(user)) return <Navigate to="/" replace />;

  return <Outlet />;
}

/** Super-admin-only admin pages; regular admins land back on the dashboard. */
export function RequireSuperAdmin() {
  const { user } = useAuth();
  if (!isSuperAdmin(user)) return <Navigate to="/admin/dashboard" replace />;
  return <Outlet />;
}
