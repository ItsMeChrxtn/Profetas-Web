import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ordersApi } from '../../api/orders.js';
import { peso } from '../../utils/peso.js';
import { formatDateTime, formatDate, formatTime, orderNumberLabel } from '../../utils/dateFormat.js';
import { DeliveryMap } from '../../components/site/DeliveryMap.jsx';
import { API_BASE } from '../../utils/apiBase.js';

const STATUS_STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Completed'];
const STEP_ICONS = { Pending: 'fa-clock', Confirmed: 'fa-check', Processing: 'fa-cog', Shipped: 'fa-truck', Completed: 'fa-box-open' };

function paymentPillClass(payment) {
  if (!payment) return 'status-pending';
  if (payment.status === 'Verified') return 'status-completed';
  if (payment.status === 'Rejected') return 'status-cancelled';
  return 'status-pending';
}

export default function TrackOrder() {
  const [orders, setOrders] = useState(null);
  const [searchParams] = useSearchParams();
  const highlight = searchParams.get('highlight');

  useEffect(() => {
    ordersApi.mine().then((data) => setOrders(data.orders));
  }, []);

  // Re-pull the list whenever the admin updates one of this customer's orders
  // (status change, courier booked/cancelled) so this page updates live, no reload needed.
  useEffect(() => {
    const source = new EventSource(`${API_BASE}/api/notifications/stream`, { withCredentials: true });
    const refresh = () => ordersApi.mine().then((data) => setOrders(data.orders));
    source.addEventListener('order:updated', refresh);
    return () => source.close();
  }, []);

  if (!orders) return null;

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 60 }}>
      <h2 className="section-title">Track Your Orders</h2>
      <p className="section-subtitle">Order status updates automatically as our team processes your order.</p>

      {orders.length === 0 && (
        <div className="farm-card text-center py-5">
          <i className="fas fa-box-open fa-2x mb-3" style={{ color: 'var(--text-muted)' }} />
          <p>You haven't placed any orders yet.</p>
          <Link to="/shop" className="btn btn-farm-primary">
            Start Shopping
          </Link>
        </div>
      )}

      {orders.map((order) => {
        const currentIndex = STATUS_STEPS.indexOf(order.status);
        const isHighlighted = String(order.orderNumber) === highlight;

        return (
          <div
            className={`farm-card mb-4 ${isHighlighted ? 'border border-2' : ''}`}
            style={isHighlighted ? { borderColor: 'var(--accent-amber)' } : undefined}
            key={order._id}
          >
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
              <div>
                <span className="fw-bold fs-5">Order {orderNumberLabel(order.orderNumber)}</span>
                <span className="text-muted small ms-2">{formatDateTime(order.orderDate)}</span>
              </div>
              <span className="fw-bold" style={{ color: 'var(--primary-green)' }}>
                {peso(order.totalAmount)}
              </span>
            </div>

            {order.status === 'Cancelled' ? (
              <div className="status-pill status-cancelled mb-3">
                <i className="fas fa-times-circle" /> Order Cancelled
              </div>
            ) : (
              <div className="tracker">
                {STATUS_STEPS.map((step, i) => {
                  const stateClass = i < currentIndex ? 'done' : i === currentIndex ? 'current done' : '';
                  return (
                    <div className={`tracker-step ${stateClass}`} key={step}>
                      <div className="tracker-dot">
                        <i className={`fas ${STEP_ICONS[step]}`} />
                      </div>
                      <div className="tracker-label">{step}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="row g-3 mt-2">
              <div className="col-md-6">
                <div className="small text-muted mb-1">Items</div>
                {order.items.map((item, i) => (
                  <div className="small" key={i}>
                    {item.productName} &times; {item.quantity} &mdash; {peso(item.subtotal)}
                  </div>
                ))}
              </div>
              <div className="col-md-3">
                <div className="small text-muted mb-1">Delivery</div>
                <div className="small fw-bold">{order.deliveryMethod}</div>
                {order.deliveryMethod === 'Self-Pickup' && order.pickupDate ? (
                  <div className="small text-muted">
                    {formatDate(order.pickupDate)} at {formatTime(order.pickupTime)}
                  </div>
                ) : (
                  order.deliveryAddress && <div className="small text-muted">{order.deliveryAddress}</div>
                )}
                {order.trackingNumber && (
                  <div className="small text-muted mt-1">
                    <i className="fas fa-truck me-1" />
                    Tracking #: <strong>{order.trackingNumber}</strong>
                  </div>
                )}
                {order.lalamoveShareLink && (
                  <a href={order.lalamoveShareLink} target="_blank" rel="noopener noreferrer" className="small d-block mt-1">
                    <i className="fas fa-location-arrow me-1" />
                    Track your rider live
                  </a>
                )}
              </div>
              <div className="col-md-3">
                <div className="small text-muted mb-1">Payment</div>
                <span className={`status-pill ${paymentPillClass(order.payment)}`}>
                  {order.payment
                    ? order.payment.status === 'Verified'
                      ? 'Paid'
                      : order.payment.status === 'Pending'
                        ? 'Pending Verification'
                        : order.payment.status
                    : 'N/A'}
                </span>
              </div>
            </div>

            {order.deliveryMethod === 'Lalamove' && order.trackingNumber && order.deliveryLat != null && order.deliveryLng != null && (
              <div className="mt-3">
                <div className="small text-muted mb-1">
                  <i className="fas fa-map-marker-alt me-1" />
                  Delivery Location
                </div>
                <DeliveryMap position={[order.deliveryLat, order.deliveryLng]} interactive={false} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
