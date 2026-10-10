import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminOrdersApi } from '../../api/admin/orders.js';
import { PageHeader } from '../../components/admin/PageHeader.jsx';
import { AdminStatusPill } from '../../components/admin/StatusPill.jsx';
import { OrderDetailsModal } from '../../components/admin/OrderDetailsModal.jsx';
import { peso } from '../../utils/peso.js';
import { formatDate, orderNumberLabel, todayDateString } from '../../utils/dateFormat.js';
import { toCsv, downloadCsv } from '../../utils/csv.js';
import { downloadPdfTable } from '../../utils/pdf.js';
import { showToast } from '../../utils/toast.js';

const STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Completed', 'Cancelled'];

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page'), 10) || 1;

  const [searchInput, setSearchInput] = useState(q);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [exporting, setExporting] = useState(false);
  const [viewingId, setViewingId] = useState(null);

  useEffect(() => {
    adminOrdersApi.list({ q, status, page }).then((data) => {
      setItems(data.items);
      setPagination(data.pagination);
    });
  }, [q, status, page]);

  async function fetchAllOrders() {
    let allItems = [];
    let exportPage = 1;
    let totalPages = 1;
    do {
      const data = await adminOrdersApi.list({ q, status, page: exportPage });
      allItems = allItems.concat(data.items);
      totalPages = data.pagination.totalPages;
      exportPage += 1;
    } while (exportPage <= totalPages);
    return allItems;
  }

  const ORDER_HEADERS = ['Order ID', 'Customer', 'Date', 'Total', 'Status'];

  async function handleExportCsv() {
    setExporting(true);
    try {
      // Raw numeric total (not peso-formatted) so spreadsheets can sum it directly.
      const rows = (await fetchAllOrders()).map((o) => [orderNumberLabel(o.orderNumber), o.customerName, formatDate(o.orderDate), o.totalAmount, o.status]);
      downloadCsv(`orders-${todayDateString()}.csv`, toCsv(ORDER_HEADERS, rows));
    } catch (err) {
      showToast('error', 'Could not export orders.');
    } finally {
      setExporting(false);
    }
  }

  async function handleExportPdf() {
    setExporting(true);
    try {
      const rows = (await fetchAllOrders()).map((o) => [orderNumberLabel(o.orderNumber), o.customerName, formatDate(o.orderDate), peso(o.totalAmount), o.status]);
      await downloadPdfTable({ title: 'Orders', headers: ORDER_HEADERS, rows, filename: `orders-${todayDateString()}.pdf` });
    } catch (err) {
      showToast('error', 'Could not export orders.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Manage and track all customer orders and deliveries."
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={handleExportCsv} disabled={exporting}>
              <i className="fas fa-file-csv" /> {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button className="btn btn-outline" onClick={handleExportPdf} disabled={exporting}>
              <i className="fas fa-file-pdf" /> {exporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
        }
      />

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 15 }}>
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

          <div className="status-filter-row">
            <button
              type="button"
              className={`status-filter-pill ${status === '' ? 'active' : ''}`}
              onClick={() => setSearchParams({ q, status: '' })}
            >
              All
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className={`status-filter-pill ${status === s ? 'active' : ''}`}
                onClick={() => setSearchParams({ q, status: s })}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Method</th>
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
                  <td>
                    <span className={`method-tag ${order.deliveryMethod === 'Lalamove' ? 'lalamove' : 'pickup'}`}>{order.deliveryMethod}</span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{peso(order.totalAmount)}</td>
                  <td>
                    <AdminStatusPill status={order.status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button type="button" className="btn btn-icon btn-outline" title="View details" onClick={() => setViewingId(order._id)}>
                        <i className="far fa-eye" />
                      </button>
                      <Link to={`/admin/delivery-booking?order_id=${order._id}`} className="btn btn-icon btn-outline" title="Update status / book delivery">
                        <i className="far fa-edit" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
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

      {viewingId && <OrderDetailsModal orderId={viewingId} onClose={() => setViewingId(null)} />}
    </>
  );
}
