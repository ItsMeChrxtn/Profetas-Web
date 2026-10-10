import { useEffect, useState } from 'react';
import { adminPaymentsApi } from '../../api/admin/payments.js';
import { PageHeader } from '../../components/admin/PageHeader.jsx';
import { AdminStatusPill } from '../../components/admin/StatusPill.jsx';
import { Modal } from '../../components/admin/Modal.jsx';
import { OrderDetailsModal } from '../../components/admin/OrderDetailsModal.jsx';
import { peso } from '../../utils/peso.js';
import { formatDateTime, orderNumberLabel } from '../../utils/dateFormat.js';
import { mediaUrl } from '../../utils/mediaUrl.js';
import { confirmAction } from '../../utils/confirm.js';
import { showToast } from '../../utils/toast.js';

const FILTERS = [
  { value: 'Pending', label: 'Pending Verification' },
  { value: 'Verified', label: 'Verified' },
  { value: 'Rejected', label: 'Rejected' },
  { value: '', label: 'All' },
];

function ReceiptModal({ order, onClose }) {
  return (
    <Modal title={`GCash Receipt - ${orderNumberLabel(order.orderNumber)}`} onClose={onClose}>
      <div className="detail-grid" style={{ marginBottom: 15 }}>
        <span>Customer</span>
        <strong>
          {order.customer?.firstName} {order.customer?.lastName}
        </strong>
        <span>Reference #</span>
        <strong>{order.payment.referenceNumber || '—'}</strong>
        <span>Amount Due</span>
        <strong>{peso(order.payment.amount)}</strong>
      </div>
      {order.payment.receiptImage ? (
        <img src={mediaUrl(order.payment.receiptImage)} alt="GCash receipt" className="receipt-preview" />
      ) : (
        <p style={{ color: 'var(--text-muted)' }}>No receipt was uploaded - only the reference number.</p>
      )}
    </Modal>
  );
}

export default function Payments() {
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [viewingId, setViewingId] = useState(null);

  function reload() {
    adminPaymentsApi.list({ status: statusFilter, page }).then((data) => {
      setOrders(data.orders);
      setPendingCount(data.pendingCount);
      setPagination(data.pagination);
    });
  }

  useEffect(reload, [statusFilter, page]); // eslint-disable-line react-hooks/exhaustive-deps

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

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 15 }}>
          <h3 className="card-title">
            <i className="fas fa-wallet" /> GCash Payments
            <span className="status-pill status-pending" style={{ marginLeft: 10 }}>
              {pendingCount} pending verification
            </span>
          </h3>
          <div className="status-filter-row">
            {FILTERS.map((f) => (
              <button
                key={f.label}
                type="button"
                className={`status-filter-pill ${statusFilter === f.value ? 'active' : ''}`}
                onClick={() => {
                  setStatusFilter(f.value);
                  setPage(1);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Reference #</th>
                <th>Receipt</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td style={{ fontWeight: 600 }}>
                    <button type="button" className="btn-link-plain" onClick={() => setViewingId(order._id)}>
                      {orderNumberLabel(order.orderNumber)}
                    </button>
                  </td>
                  <td style={{ fontSize: 12 }}>{formatDateTime(order.payment.createdAt)}</td>
                  <td>
                    {order.customer?.firstName} {order.customer?.lastName}
                  </td>
                  <td>{order.payment.referenceNumber || '—'}</td>
                  <td>
                    <button type="button" className="btn btn-icon btn-outline" title="View receipt" onClick={() => setReceiptOrder(order)}>
                      <i className={order.payment.receiptImage ? 'far fa-image' : 'far fa-file-alt'} />
                    </button>
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {peso(order.payment.amount)}
                    {order.deliveryFeePayment === 'Rider' && (
                      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>+ {peso(order.deliveryFee)} to rider</div>
                    )}
                  </td>
                  <td>
                    <AdminStatusPill status={order.payment.status} style={{ fontSize: 11 }} />
                  </td>
                  <td>
                    {order.payment.status === 'Pending' ? (
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-icon btn-outline" style={{ color: '#166534' }} title="Verify" onClick={() => handleReview(order, 'verify')}>
                          <i className="fas fa-check" />
                        </button>
                        <button className="btn btn-icon btn-outline text-danger" title="Reject" onClick={() => handleReview(order, 'reject')}>
                          <i className="fas fa-times" />
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                    {statusFilter === 'Pending' ? 'No payments waiting for verification.' : 'No payments match this filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="pagination" style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', marginTop: 20 }}>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((i) => (
              <button key={i} className={`btn btn-icon ${i === page ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPage(i)}>
                {i}
              </button>
            ))}
          </div>
        )}
      </div>

      {receiptOrder && <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />}
      {viewingId && <OrderDetailsModal orderId={viewingId} onClose={() => setViewingId(null)} />}
    </>
  );
}
