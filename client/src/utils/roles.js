// Staff roles. superadmin has full access; admin handles day-to-day operations.
export const isAdmin = (user) => user?.role === 'admin' || user?.role === 'superadmin';
export const isSuperAdmin = (user) => user?.role === 'superadmin';
