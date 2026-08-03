import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { adminOrdersApi } from '../../api/admin/orders.js';
import { PageHeader } from '../../components/admin/PageHeader.jsx';
import { peso } from '../../utils/peso.js';
import { formatDateTime, formatDate, formatTime } from '../../utils/dateFormat.js';
import { showToast } from '../../utils/toast.js';

const STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Completed', 'Cancelled'];

const STYLE = `
.booking-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: start; }
.booking-card { background: var(--white); border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); padding: 30px; margin-bottom: 30px; }
.booking-card-title { display: flex; align-items: center; gap: 12px; font-size: 18px; font-weight: 700; margin-bottom: 25px; color: var(--text-main); }
.booking-card-title i { color: var(--primary-green); font-size: 20px; }
.info-row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px; }
.info-label { color: var(--text-muted); font-weight: 500; }
.info-value { color: var(--text-main); font-weight: 600; text-align: right; }
.order-id-badge { font-size: 24px; font-weight: 800; color: var(--text-main); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
.status-badge { padding: 6px 15px; border-radius: 20px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px; }
.status-pending-light { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
.section-divider { height: 1px; background: var(--border-color); margin: 25px 0; }
.lalamove-integration { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.lalamove-logo { color: #F68B1E; font-size: 24px; }
.lalamove-text { font-size: 18px; font-weight: 700; }
.lalamove-sub { font-size: 14px; color: var(--text-muted); margin-bottom: 25px; }
.location-box { border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 15px 20px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px; }
.location-icon { width: 40px; height: 40px; background: #F3F4F6; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--primary-green); font-size: 18px; }
.location-details { flex: 1; }
.location-name { font-weight: 700; font-size: 14px; margin-bottom: 2px; }
.location-addr { font-size: 12px; color: var(--text-muted); }
.alert-box { background: #F0FDF4; border: 1px solid #DCFCE7; border-radius: var(--radius-md); padding: 15px 20px; display: flex; align-items: center; gap: 12px; margin-bottom: 25px; font-size: 13px; color: #166534; }
.btn-book { width: 100%; background: var(--primary-green); color: white; padding: 16px; border-radius: var(--radius-md); font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 10px; border: none; cursor: pointer; font-size: 16px; }
.update-status-section { margin-top: 10px; }
.update-status-title { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 16px; margin-bottom: 10px; }
.update-status-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; }
.btn-update { width: 100%; background: var(--primary-green); color: white; padding: 14px; border-radius: var(--radius-md); font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 10px; border: none; cursor: pointer; margin-top: 15px; }
.delivery-info-card { background: #F9FAFB; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; display: flex; align-items: flex-start; gap: 15px; }
.delivery-info-icon { width: 40px; height: 40px; background: white; border: 1px solid var(--border-color); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--primary-green); font-size: 18px; }
.delivery-info-content h4 { font-size: 14px; font-weight: 700; margin-bottom: 5px; }
.delivery-info-content p { font-size: 12px; color: var(--text-muted); line-height: 1.5; }
.label-group { margin-bottom: 15px; }
.label-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; }
@media (max-width: 992px) { .booking-grid { grid-template-columns: 1fr; } }
`;

export default function DeliveryBooking() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [statusValue, setStatusValue] = useState('');
  const [updating, setUpdating] = useState(false);
  const [booking, setBooking] = useState(false);

  function load() {
    if (!orderId) return;
    adminOrdersApi.get(orderId).then((data) => {
      setOrder(data.order);
      setStatusValue(data.order.status);
    });
  }

  useEffect(load, [orderId]);

  async function handleUpdateStatus(e) {
    e.preventDefault();
    setUpdating(true);
    try {
      await adminOrdersApi.updateStatus(orderId, statusValue);
      showToast('success', `Order status updated to ${statusValue}.`);
      load();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleBookCourier() {
    setBooking(true);
    try {
      const data = await adminOrdersApi.bookCourier(orderId);
      showToast('success', `Booked with Lalamove - tracking number ${data.order.trackingNumber}.`);
      load();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setBooking(false);
    }
  }

  return (
    <>
      <style>{STYLE}</style>
      <PageHeader
        title="Delivery Booking"
        subtitle="Book a delivery and update the order status."
        actions={
          <button className="btn btn-outline" onClick={() => navigate('/admin/orders')}>
            <i className="fas fa-arrow-left" /> Back to Orders
          </button>
        }
      />

      {!order ? (
        <div className="booking-card" style={{ textAlign: 'center', padding: '60px 30px' }}>
          <i className="far fa-file-alt" style={{ fontSize: 40, color: 'var(--text-muted)', marginBottom: 15 }} />
          <p style={{ color: 'var(--text-muted)' }}>
            No order selected. Open an order from the <Link to="/admin/orders">Orders</Link> page to view its delivery booking and update
            its status.
          </p>
        </div>
      ) : (
        <div className="booking-grid">
          <div className="booking-column">
            <div className="booking-card">
              <div className="booking-card-title">
                <i className="far fa-file-alt" /> Order Details
              </div>

              <div className="order-id-badge">
                <span>Order #{String(order.orderNumber).padStart(6, '0')}</span>
                <span className="status-badge status-pending-light">
                  <i className="far fa-clock" /> {order.status}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Order Date</span>
                <span className="info-value">{formatDateTime(order.orderDate)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Payment Method</span>
                <span className="info-value">GCash &mdash; {order.payment ? order.payment.status : 'No record'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Order Total</span>
                <span className="info-value">{peso(order.totalAmount)}</span>
              </div>

              <div className="section-divider" />

              <div className="booking-card-title">
                <i className="far fa-user" /> Customer Information
              </div>
              <div className="info-row">
                <span className="info-label">Customer Name</span>
                <span className="info-value">
                  {order.customer?.firstName} {order.customer?.lastName}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Contact Number</span>
                <span className="info-value">{order.customer?.contactNumber || '—'}</span>
              </div>
              <div className="info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
                <span className="info-label">Delivery Address</span>
                <span className="info-value" style={{ textAlign: 'left' }}>
                  {order.deliveryMethod === 'Self-Pickup' ? (
                    <>
                      Self-Pickup on {formatDate(order.pickupDate)} at {formatTime(order.pickupTime)}
                    </>
                  ) : (
                    <>
                      {order.deliveryAddress || '—'}
                      {order.deliveryLandmark ? ` (near ${order.deliveryLandmark})` : ''}
                    </>
                  )}
                </span>
              </div>

              <div className="section-divider" />
              <div className="booking-card-title" style={{ marginBottom: 10 }}>
                <i className="far fa-clipboard" /> Items
              </div>
              {order.items.map((item, i) => (
                <div className="info-row" key={i}>
                  <span className="info-label">
                    {item.productName} &times; {item.quantity}
                  </span>
                  <span className="info-value">{peso(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="booking-card">
              <div className="update-status-section">
                <div className="update-status-title" id="statusUpdate">
                  <i className="fas fa-sync-alt" /> Status Update
                </div>
                <p className="update-status-sub">Update the order status once the delivery booking is confirmed.</p>

                <form onSubmit={handleUpdateStatus}>
                  <div className="label-group">
                    <label>Update Status</label>
                    <select className="form-control" value={statusValue} onChange={(e) => setStatusValue(e.target.value)}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn-update" disabled={updating}>
                    <i className="far fa-check-circle" /> {updating ? 'Updating...' : 'Update Status'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="booking-column">
            <div className="booking-card">
              {order.deliveryMethod === 'Self-Pickup' ? (
                <>
                  <div className="lalamove-integration">
                    <i className="fas fa-store lalamove-logo" style={{ color: 'var(--primary-green)' }} />
                    <span className="lalamove-text">Self-Pickup</span>
                  </div>
                  <p className="lalamove-sub">Customer will pick up their order at the farm.</p>
                  <div className="label-group">
                    <div className="location-box">
                      <div className="location-icon">
                        <i className="fas fa-calendar-alt" />
                      </div>
                      <div className="location-details">
                        <div className="location-name">{formatDate(order.pickupDate)}</div>
                        <div className="location-addr">{formatTime(order.pickupTime)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="alert-box">
                    <i className="fas fa-info-circle" />
                    <span>Have the order ready and packed by the scheduled pickup time.</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="lalamove-integration">
                    <i className="fas fa-dove lalamove-logo" />
                    <span className="lalamove-text">Lalamove Booking</span>
                  </div>
                  <p className="lalamove-sub">Book a Lalamove delivery for this order.</p>

                  <div className="label-group">
                    <label>Pickup Location</label>
                    <div className="location-box">
                      <div className="location-icon">
                        <i className="fas fa-store" />
                      </div>
                      <div className="location-details">
                        <div className="location-name">Profetas Farm</div>
                        <div className="location-addr">Tres Cruces, Tanza, Cavite</div>
                      </div>
                    </div>
                  </div>

                  <div className="label-group">
                    <label>Delivery Address</label>
                    <div className="location-box">
                      <div className="location-icon">
                        <i className="fas fa-map-marker-alt" />
                      </div>
                      <div className="location-details">
                        <div className="location-name">
                          {order.customer?.firstName} {order.customer?.lastName}
                        </div>
                        <div className="location-addr">{order.deliveryAddress || '—'}</div>
                      </div>
                    </div>
                  </div>

                  {order.deliveryLat && order.deliveryLng && (
                    <div className="alert-box">
                      <i className="fas fa-map-marked-alt" />
                      <span>
                        Pinned location: {order.deliveryLat.toFixed(5)}, {order.deliveryLng.toFixed(5)}
                      </span>
                    </div>
                  )}

                  {order.trackingNumber ? (
                    <div className="alert-box" style={{ background: '#DBEAFE', color: '#1E40AF', marginBottom: 0 }}>
                      <i className="fas fa-check-circle" />
                      <span>
                        Booked with Lalamove &mdash; tracking number <strong>{order.trackingNumber}</strong>
                      </span>
                    </div>
                  ) : (
                    <button className="btn-book" onClick={handleBookCourier} disabled={booking}>
                      <i className="fas fa-truck" /> {booking ? 'Booking...' : 'Book with Lalamove'}
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="delivery-info-card">
              <div className="delivery-info-icon">
                <i className="fas fa-truck-loading" />
              </div>
              <div className="delivery-info-content">
                <h4>Keep the Customer Updated</h4>
                <p>
                  The status you set here shows up live on the customer's order tracking page, in the same Pending &rarr; Confirmed
                  &rarr; Processing &rarr; Shipped &rarr; Completed order.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
