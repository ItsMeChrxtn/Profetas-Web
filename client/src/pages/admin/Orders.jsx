import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminOrdersApi } from '../../api/admin/orders.js';
import { PageHeader } from '../../components/admin/PageHeader.jsx';
import { AdminStatusPill } from '../../components/admin/StatusPill.jsx';
import { peso } from '../../utils/peso.js';
import { formatDate, orderNumberLabel } from '../../utils/dateFormat.js';

const STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Completed', 'Cancelled'];

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page'), 10) || 1;

  const [searchInput, setSearchInput] = useState(q);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  useEffect(() => {
    adminOrdersApi.list({ q, status, page }).then((data) => {
      setItems(data.items);
      setPagination(data.pagination);
    });
  }, [q, status, page]);

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Manage and track all customer orders and deliveries."
        actions={
          <button className="btn btn-outline">
            <i className="fas fa-download" /> Export
          </button>
        }
      />

      <div className="card">
        <div className="card-header">
          <form
            className="header-search"
            style={{ width: 350 }}
            onSubmit={(e) => {
              e.preventDefault();
              setSearchParams({ q: searchInput.trim(), status });
            }}
          >
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search orders by ID or customer..."
              className="form-control"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
          <select className="form-control" style={{ width: 150 }} value={status} onChange={(e) => setSearchParams({ q, status: e.target.value })}>
            <option value="">All Status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((order) => (
                <tr key={order._id}>
                  <td style={{ fontWeight: 600 }}>{orderNumberLabel(order.orderNumber)}</td>
                  <td>{order.customerName}</td>
                  <td>{formatDate(order.orderDate)}</td>
                  <td style={{ fontWeight: 700 }}>{peso(order.totalAmount)}</td>
                  <td>
                    <AdminStatusPill status={order.status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <Link to={`/admin/delivery-booking?order_id=${order._id}`} className="btn btn-icon btn-outline">
                        <i className="far fa-eye" />
                      </Link>
                      <Link to={`/admin/delivery-booking?order_id=${order._id}#statusUpdate`} className="btn btn-icon btn-outline">
                        <i className="far fa-edit" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card-footer" style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Showing {items.length} of {pagination.total} entries
          </span>
          <div className="pagination" style={{ display: 'flex', gap: 5 }}>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((i) => (
              <button key={i} className={`btn btn-icon ${i === page ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSearchParams({ q, status, page: i })}>
                {i}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
