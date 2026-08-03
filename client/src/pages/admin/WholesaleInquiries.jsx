import { useEffect, useState } from 'react';
import { adminWholesaleApi } from '../../api/admin/wholesale.js';
import { PageHeader } from '../../components/admin/PageHeader.jsx';
import { Modal } from '../../components/admin/Modal.jsx';
import { peso } from '../../utils/peso.js';
import { formatDate } from '../../utils/dateFormat.js';
import { showToast } from '../../utils/toast.js';

const STATUSES = ['New', 'Quoted', 'Closed'];

function statusClass(status) {
  if (status === 'New') return 'status-pending';
  if (status === 'Quoted') return 'status-processing';
  return 'status-completed';
}

function excerpt(text) {
  return text.length > 80 ? `${text.slice(0, 80)}...` : text;
}

function RespondModal({ inquiry, onClose, onSaved }) {
  const [status, setStatus] = useState(inquiry.status);
  const [adminResponse, setAdminResponse] = useState(inquiry.adminResponse || '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminWholesaleApi.update(inquiry._id, status, adminResponse);
      showToast('success', 'Inquiry response saved.');
      onSaved();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Wholesale Inquiry - ${inquiry.name}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn btn-primary" form="inquiryForm" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Response'}
          </button>
        </>
      }
    >
      <form id="inquiryForm" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Requested Items</label>
          <textarea className="form-control" rows={3} disabled value={inquiry.requestedItems} />
        </div>
        <div className="form-group">
          <label>Contact</label>
          <input type="text" className="form-control" disabled value={`${inquiry.name} - ${inquiry.contactNumber} - ${inquiry.location}`} />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Quotation / Response Notes</label>
          <textarea
            className="form-control"
            rows={4}
            placeholder="e.g. Quoted 5 sacks Oyster Mushroom @ P100/kg wholesale rate..."
            value={adminResponse}
            onChange={(e) => setAdminResponse(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}

export default function WholesaleInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [newCount, setNewCount] = useState(0);
  const [selected, setSelected] = useState(null);

  function reload() {
    adminWholesaleApi.list().then((data) => {
      setInquiries(data.inquiries);
      setNewCount(data.newCount);
    });
  }

  useEffect(reload, []);

  return (
    <>
      <PageHeader title="Wholesale Inquiries" subtitle="Review bulk/reseller inquiries from the customer site and send quotations." />

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <i className="fas fa-truck-loading" /> Wholesale Inquiries
          </h3>
          <span className="status-pill status-pending">{newCount} new</span>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Requested Items</th>
                <th>Est. Budget</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => (
                <tr key={inquiry._id}>
                  <td style={{ fontSize: 12 }}>{formatDate(inquiry.createdAt)}</td>
                  <td style={{ fontWeight: 600 }}>{inquiry.name}</td>
                  <td>{inquiry.contactNumber}</td>
                  <td>{inquiry.location}</td>
                  <td style={{ maxWidth: 220, fontSize: 12, color: 'var(--text-muted)' }}>{excerpt(inquiry.requestedItems)}</td>
                  <td>{inquiry.estimatedBudget ? peso(inquiry.estimatedBudget) : '—'}</td>
                  <td>
                    <span className={`status-pill ${statusClass(inquiry.status)}`}>{inquiry.status}</span>
                  </td>
                  <td>
                    <button className="btn btn-icon btn-outline" onClick={() => setSelected(inquiry)}>
                      <i className="far fa-eye" />
                    </button>
                  </td>
                </tr>
              ))}
              {inquiries.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                    No wholesale inquiries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <RespondModal
          inquiry={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            reload();
          }}
        />
      )}
    </>
  );
}
