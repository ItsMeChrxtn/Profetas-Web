import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminOrdersApi } from '../../api/admin/orders.js';
import { Modal } from './Modal.jsx';
import { AdminStatusPill } from './StatusPill.jsx';
import { peso } from '../../utils/peso.js';
import { formatDate, formatDateTime, formatTime, orderNumberLabel } from '../../utils/dateFormat.js';
import { mediaUrl } from '../../utils/mediaUrl.js';

/** Read-only order details, opened from the Orders list's view (eye) button. */
export function OrderDetailsModal({ orderId, onClose }) {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    adminOrdersApi.get(orderId).then((data) => setOrder(data.order));
  }, [orderId]);

  return (
    <Modal
      size="lg"
      title={order ? `Order ${orderNumberLabel(order.orderNumber)}` : 'Order Details'}
      onClose={onClose}
      footer={
        <Link to={`/admin/delivery-booking?order_id=${orderId}`} className="btn btn-primary">
          <i className="far fa-edit" /> Manage Order
        </Link>
      }
    >
      {!order ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            <AdminStatusPill status={order.status} />
            <span className={`method-tag ${order.deliveryMethod === 'Lalamove' ? 'lalamove' : 'pickup'}`}>{order.deliveryMethod}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatDateTime(order.orderDate)}</span>
          </div>

          <div className="detail-grid">
            <span>Customer</span>
            <strong>
              {order.customer?.firstName} {order.customer?.lastName}
              {order.customer?.isWholesaler && (
                <span className="wholesaler-tag">
                  <i className="fas fa-check-circle" /> Wholesaler
                </span>
              )}
            </strong>
            <span>Contact Number</span>
            <strong>{order.customer?.contactNumber || '—'}</strong>
            {order.deliveryMethod === 'Self-Pickup' ? (
              <>
                <span>Pickup Schedule</span>
                <strong>
                  {formatDate(order.pickupDate)} at {formatTime(order.pickupTime)}
                </strong>
              </>
            ) : (
              <>
                <span>Delivery Address</span>
                <strong>
                  {order.deliveryAddress || '—'}
                  {order.deliveryLandmark ? ` (near ${order.deliveryLandmark})` : ''}
                </strong>
                <span>Weight / Vehicle</span>
                <strong>
                  {order.totalWeightKg || 0} kg &middot; {order.lalamoveServiceType || 'MOTORCYCLE'}
                </strong>
                <span>Rider Booking</span>
                <strong>{order.trackingNumber ? `Booked (${order.trackingNumber})` : 'Not booked yet'}</strong>
              </>
            )}
          </div>

          <div style={{ fontWeight: 700, margin: '20px 0 10px' }}>Items</div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.productName}</td>
                    <td>{peso(item.unitPrice)}</td>
                    <td>{item.quantity}</td>
                    <td>{peso(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="detail-grid" style={{ marginTop: 15 }}>
            <span>Subtotal</span>
            <strong>{peso(order.subtotal)}</strong>
            <span>Delivery Fee</span>
            <strong>
              {peso(order.deliveryFee)}
              {order.deliveryFeePayment === 'Rider' && ' (paid in cash to the rider)'}
            </strong>
            <span>Total</span>
            <strong style={{ fontSize: 16 }}>{peso(order.totalAmount)}</strong>
          </div>

          <div style={{ fontWeight: 700, margin: '20px 0 10px' }}>GCash Payment</div>
          <div className="detail-grid">
            <span>Status</span>
            <strong>
              <AdminStatusPill status={order.payment?.status || 'Pending'} />
            </strong>
            <span>Amount</span>
            <strong>{peso(order.payment?.amount)}</strong>
            <span>Reference #</span>
            <strong>{order.payment?.referenceNumber || '—'}</strong>
          </div>
          {order.payment?.receiptImage && (
            <img src={mediaUrl(order.payment.receiptImage)} alt="GCash receipt" className="receipt-preview" style={{ marginTop: 15 }} />
          )}
        </>
      )}
    </Modal>
  );
}
