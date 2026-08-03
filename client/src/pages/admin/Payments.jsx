import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminPaymentsApi } from '../../api/admin/payments.js';
import { PageHeader } from '../../components/admin/PageHeader.jsx';
import { peso } from '../../utils/peso.js';
import { formatDateTime, orderNumberLabel } from '../../utils/dateFormat.js';
import { confirmAction } from '../../utils/confirm.js';
import { showToast } from '../../utils/toast.js';

function transactionStatusClass(status) {
  if (status === 'Verified') return 'status-completed';
  if (status === 'Rejected') return 'status-pending';
  return 'status-processing';
}

export default function Payments() {
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);

  function reload() {
    adminPaymentsApi.pending().then((data) => setPending(data.orders));
    adminPaymentsApi.history().then((data) => setHistory(data.orders));
  }

  useEffect(reload, []);

  async function handleReview(order, action) {
    const confirmed = await confirmAction(
      action === 'verify' ? 'Verify this payment?' : 'Reject this payment?',
      action === 'verify' ? { icon: 'question', confirmButtonText: 'Yes, verify' } : { confirmButtonText: 'Yes, reject' }
    );
    if (!confirmed) return;
    try {
      await adminPaymentsApi.review(order._id, action);
      showToast('success', action === 'verify' ? 'Payment verified and order confirmed.' : 'Payment marked as rejected.');
      reload();
    } catch (err) {
      showToast('error', err.message);
    }
  }

  return (
    <>
      <PageHeader title="Payments" subtitle="Review and verify customer GCash payments." />

      <div className="card" style={{ marginBottom: 30 }}>
        <div className="card-header">
          <h3 className="card-title">
            <i className="fas fa-wallet" /> Pending GCash Verifications
          </h3>
          <span className="status-pill status-pending">{pending.length} awaiting review</span>
        </div>

        {pending.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '10px 0' }}>No payments waiting for verification.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Reference #</th>
                  <th>Receipt</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((order) => (
                  <tr key={order._id}>
                    <td style={{ fontWeight: 600 }}>
                      <Link to={`/admin/delivery-booking?order_id=${order._id}`}>{orderNumberLabel(order.orderNumber)}</Link>
                    </td>
                    <td>
                      {order.customer?.firstName} {order.customer?.lastName}
                    </td>
                    <td>{order.payment.referenceNumber || '—'}</td>
                    <td>
                      {order.payment.receiptImage ? (
                        <a href={order.payment.receiptImage} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>No receipt</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>{peso(order.payment.amount)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-icon btn-outline" style={{ color: '#166534' }} title="Verify" onClick={() => handleReview(order, 'verify')}>
                          <i className="fas fa-check" />
                        </button>
                        <button className="btn btn-icon btn-outline text-danger" title="Reject" onClick={() => handleReview(order, 'reject')}>
                          <i className="fas fa-times" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <i className="fas fa-history" /> Transaction History
          </h3>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Date & Time</th>
                <th>Method</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((order) => (
                <tr key={order._id}>
                  <td style={{ fontSize: 12, fontWeight: 600 }}>{orderNumberLabel(order.orderNumber)}</td>
                  <td style={{ fontSize: 12 }}>{formatDateTime(order.payment.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <i className="fas fa-wallet" /> {order.payment.method}
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {orderNumberLabel(order.orderNumber)} &mdash; {order.customer?.firstName} {order.customer?.lastName}
                  </td>
                  <td style={{ fontWeight: 700, color: '#166534' }}>{peso(order.payment.amount)}</td>
                  <td>
                    <span className={`status-pill ${transactionStatusClass(order.payment.status)}`} style={{ fontSize: 11 }}>
                      {order.payment.status}
                    </span>
                  </td>
                  <td>
                    <Link to={`/admin/delivery-booking?order_id=${order._id}`} className="btn btn-icon btn-outline">
                      <i className="far fa-eye" />
                    </Link>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
