// superOnly items are hidden from regular admins (the server enforces it too).
export const ADMIN_NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'fa-th-large' },
  { to: '/admin/orders', label: 'Orders', icon: 'fa-shopping-bag' },
  { to: '/admin/products', label: 'Products', icon: 'fa-box' },
  { to: '/admin/product-archive', label: 'Product Archive', icon: 'fa-archive', superOnly: true },
  { to: '/admin/inventory', label: 'Inventory', icon: 'fa-warehouse' },
  { to: '/admin/customers', label: 'Customers', icon: 'fa-users' },
  { to: '/admin/reports', label: 'Reports', icon: 'fa-chart-bar', superOnly: true },
  { to: '/admin/payments', label: 'Payments', icon: 'fa-credit-card' },
  { to: '/admin/delivery-booking', label: 'Delivery Booking', icon: 'fa-truck' },
  { to: '/admin/wholesaler-applications', label: 'Wholesaler Applications', icon: 'fa-handshake', superOnly: true },
  { to: '/admin/farm-visits', label: 'Farm Visits', icon: 'fa-tractor' },
  { to: '/admin/education-posts', label: 'Education Posts', icon: 'fa-book-open' },
  { to: '/admin/users', label: 'User Management', icon: 'fa-user-shield', superOnly: true },
  { to: '/admin/settings', label: 'Settings', icon: 'fa-cog' },
];
