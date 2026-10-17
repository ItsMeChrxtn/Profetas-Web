import { useEffect, useState } from 'react';
import { adminCustomersApi } from '../../api/admin/customers.js';
import { Modal } from './Modal.jsx';
import { AdminStatusPill } from './StatusPill.jsx';
import { peso } from '../../utils/peso.js';
import { formatDate, formatDateTime, orderNumberLabel } from '../../utils/dateFormat.js';
import { showToast } from '../../utils/toast.js';

function useCustomer(id) {
  const [data, setData] = useState(null);
  const reload = () => adminCustomersApi.get(id).then(setData);
  useEffect(() => {
    reload();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  return [data, reload];
}

function AccountHistory({ history }) {
  if (!history?.length) return <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No violations or account actions recorded.</p>;
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Action</th>
            <th>Reason / Subject</th>
            <th>By</th>
          </tr>
        </thead>
        <tbody>
          {[...history].reverse().map((h, i) => (
            <tr key={i}>
              <td style={{ fontSize: 12 }}>{formatDateTime(h.at)}</td>
              <td>{h.action}</td>
              <td style={{ fontSize: 13 }}>{h.reason}</td>
              <td style={{ fontSize: 12 }}>{h.by || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 1. View Details - profile, email, last login, order history, total spent, violation history. */
export function CustomerDetailsModal({ customerId, onClose }) {
  const [data] = useCustomer(customerId);
  const c = data?.customer;

  return (
    <Modal size="lg" title="Customer Details" onClose={onClose}>
      {!c ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div className="customer-avatar">{c.firstName[0]?.toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                {c.firstName} {c.lastName}
                {c.isWholesaler && (
                  <span className="wholesaler-tag">
                    <i className="fas fa-check-circle" /> Wholesaler
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Customer since {formatDate(c.createdAt)}</div>
            </div>
            <AdminStatusPill status={c.status} />
          </div>

          <div className="detail-grid">
            <span>Email</span>
            <strong>{c.email}</strong>
            <span>Contact Number</span>
            <strong>{c.contactNumber || '—'}</strong>
            <span>Last Login</span>
            <strong>{c.lastLoginAt ? formatDateTime(c.lastLoginAt) : 'Never'}</strong>
            <span>Total Spent</span>
            <strong>{peso(data.totalSpent)}</strong>
            {c.businessName && (
              <>
                <span>Business</span>
                <strong>{c.businessName}</strong>
              </>
            )}
            {c.accountStatus === 'Suspended' && (
              <>
                <span>Suspension Reason</span>
                <strong style={{ color: 'var(--danger-text)' }}>{c.suspensionReason}</strong>
              </>
            )}
          </div>

          <div style={{ fontWeight: 700, margin: '20px 0 10px' }}>Order History ({data.orders.length})</div>
          {data.orders.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No orders yet.</p>
          ) : (
            <div className="table-container" style={{ maxHeight: 240, overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((o) => (
                    <tr key={o._id}>
                      <td>{orderNumberLabel(o.orderNumber)}</td>
                      <td style={{ fontSize: 12 }}>{formatDate(o.orderDate)}</td>
                      <td style={{ fontSize: 12 }}>{o.deliveryMethod}</td>
                      <td>{peso(o.totalAmount)}</td>
                      <td>
                        <AdminStatusPill status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ fontWeight: 700, margin: '20px 0 10px' }}>Violation & Account History</div>
          <AccountHistory history={c.accountHistory} />
        </>
      )}
    </Modal>
  );
}

/** 2. Manage Account - suspend / unsuspend / warn, with a recorded reason. Super admin only. */
export function ManageCustomerModal({ customerId, onClose, onChanged }) {
  const [data, reload] = useCustomer(customerId);
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const c = data?.customer;
  const suspended = c?.accountStatus === 'Suspended';

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminCustomersApi.updateAccount(customerId, action, reason);
      showToast('success', res.message);
      setAction('');
      setReason('');
      await reload();
      onChanged();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Manage Account" onClose={onClose}>
      {!c ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <div>
              <div style={{ fontWeight: 700 }}>
                {c.firstName} {c.lastName}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.email}</div>
            </div>
            <AdminStatusPill status={c.status} />
          </div>

          {suspended && (
            <div className="alert-inline" style={{ marginBottom: 15 }}>
              <strong>Suspended:</strong> {c.suspensionReason}. This customer can't log in or place orders.
            </div>
          )}

          <form onSubmit={submit}>
            <div className="status-filter-row" style={{ marginBottom: 12 }}>
              {suspended ? (
                <button type="button" className={`status-filter-pill ${action === 'unsuspend' ? 'active' : ''}`} onClick={() => setAction('unsuspend')}>
                  <i className="fas fa-unlock" /> Unsuspend
                </button>
              ) : (
                <button type="button" className={`status-filter-pill ${action === 'suspend' ? 'active' : ''}`} onClick={() => setAction('suspend')}>
                  <i className="fas fa-ban" /> Suspend
                </button>
              )}
              <button type="button" className={`status-filter-pill ${action === 'warn' ? 'active' : ''}`} onClick={() => setAction('warn')}>
                <i className="fas fa-exclamation-triangle" /> Record Warning
              </button>
            </div>
            {action && (
              <>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
                  Reason
                </label>
                <textarea className="form-control" rows={3} required value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button type="submit" className="btn btn-primary" disabled={saving || !reason.trim()}>
                    {saving ? 'Saving...' : 'Confirm'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div style={{ fontWeight: 700, margin: '20px 0 10px' }}>History</div>
          <AccountHistory history={c.accountHistory} />
        </>
      )}
    </Modal>
  );
}

const TEMPLATES = {
  order: { subject: 'About your order', message: 'We are reaching out about your recent order.\n\n' },
  warning: { subject: 'Account notice', message: 'We noticed activity on your account that goes against our policies.\n\n' },
  suspension: { subject: 'Your account has been suspended', message: 'Your Profeta Integrated Farm account has been suspended.\n\nReason: ' },
};

/** 3. Contact Customer - email about an order, a warning, or a suspension. Super admin only. */
export function ContactCustomerModal({ customer, onClose }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function send(e) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await adminCustomersApi.contact(customer.id, subject, message);
      showToast('success', res.message);
      onClose();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      title={`Email ${customer.firstName} ${customer.lastName}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" form="contactForm" type="submit" disabled={sending}>
            <i className="fas fa-paper-plane" /> {sending ? 'Sending...' : 'Send Email'}
          </button>
        </>
      }
    >
      <div className="status-filter-row" style={{ marginBottom: 12 }}>
        {Object.entries(TEMPLATES).map(([key, t]) => (
          <button
            key={key}
            type="button"
            className="status-filter-pill"
            onClick={() => {
              setSubject(t.subject);
              setMessage(t.message);
            }}
          >
            {key === 'order' ? 'Order' : key === 'warning' ? 'Warning' : 'Suspension'}
          </button>
        ))}
      </div>
      <form id="contactForm" onSubmit={send}>
        <div className="form-group">
          <label>Subject</label>
          <input className="form-control" required value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Message</label>
          <textarea className="form-control" rows={6} required value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
      </form>
    </Modal>
  );
}
