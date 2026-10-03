import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { adminDashboardApi } from '../../api/admin/dashboard.js';
import { PageHeader } from '../../components/admin/PageHeader.jsx';
import { StatCard } from '../../components/admin/StatCard.jsx';
import { AdminStatusPill } from '../../components/admin/StatusPill.jsx';
import { peso } from '../../utils/peso.js';
import { formatDate, orderNumberLabel } from '../../utils/dateFormat.js';

const PIE_COLORS = ['#7B1E2B', '#F59E0B', '#EF4444'];

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminDashboardApi.get().then(setData);
  }, []);

  if (!data) return null;

  const { stats, recentOrders, topProducts, salesTrend, stockBreakdown } = data;
  const totalStockedProducts = stockBreakdown.inStock + stockBreakdown.lowStock + stockBreakdown.outOfStock;
  const pieData = [
    { name: 'In Stock', value: stockBreakdown.inStock },
    { name: 'Low Stock', value: stockBreakdown.lowStock },
    { name: 'Out of Stock', value: stockBreakdown.outOfStock },
  ];

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="Welcome back! Here's what's happening with Profetas Farm." />

      <div className="stats-grid">
        <StatCard icon="fa-leaf" iconColor="green" label="Total Orders" value={stats.totalOrders} />
        <StatCard icon="fa-shopping-bag" iconColor="amber" label="Total Revenue" value={peso(stats.totalRevenue)} />
        <StatCard icon="fa-box" iconColor="blue" label="Products" value={stats.totalProducts} />
        <StatCard icon="fa-users" iconColor="amber" label="Customers" value={stats.totalCustomers} />
        <StatCard icon="fa-leaf" iconColor="green" label="Low Stock Items" value={stats.lowStockCount} />
      </div>

      <div className="dashboard-row cols-even">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fas fa-chart-line" /> Sales Overview
            </h3>
            <span className="text-muted small">Last 30 Days</span>
          </div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" tickFormatter={(d) => formatDate(d, { month: 'short', day: 'numeric' })} minTickGap={30} fontSize={11} />
                <YAxis fontSize={11} width={50} />
                <Tooltip formatter={(v) => peso(v)} labelFormatter={(d) => formatDate(d)} />
                <Line type="monotone" dataKey="revenue" stroke="#7B1E2B" fill="rgba(123,30,43,0.1)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fas fa-list" /> Recent Orders
            </h3>
            <Link to="/admin/orders" className="btn btn-outline btn-sm" style={{ padding: '8px 15px', fontSize: 12 }}>
              View All Orders
            </Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                      No recent orders
                    </td>
                  </tr>
                )}
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td>{orderNumberLabel(order.orderNumber)}</td>
                    <td>
                      {order.customer?.firstName} {order.customer?.lastName}
                    </td>
                    <td>{formatDate(order.orderDate)}</td>
                    <td>{peso(order.totalAmount)}</td>
                    <td>
                      <AdminStatusPill status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="dashboard-row cols-wide-left">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fas fa-box-open" /> Top Products
            </h3>
            <Link to="/admin/products" className="btn btn-outline btn-sm" style={{ padding: '8px 15px', fontSize: 12 }}>
              View All Products
            </Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                      No top products
                    </td>
                  </tr>
                )}
                {topProducts.map((p) => (
                  <tr key={p._id}>
                    <td>{p.name}</td>
                    <td>{p.unitsSold}</td>
                    <td>{peso(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fas fa-warehouse" /> Inventory Summary
            </h3>
            <Link to="/admin/inventory" className="btn btn-outline btn-sm" style={{ padding: '8px 15px', fontSize: 12 }}>
              View Inventory
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 250 }}>
            <div style={{ position: 'relative', width: 150, height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={45} outerRadius={70}>
                    {pieData.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: 24, fontWeight: 800 }}>{totalStockedProducts}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Total Products</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {pieData.map((entry, i) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i] }} />
                  <span>
                    {entry.name}: {entry.value} ({totalStockedProducts > 0 ? ((entry.value / totalStockedProducts) * 100).toFixed(1) : '0.0'}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
