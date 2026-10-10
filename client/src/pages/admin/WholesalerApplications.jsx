import { useEffect, useState } from 'react';
import { adminWholesalerApi } from '../../api/admin/wholesaler.js';
import { PageHeader } from '../../components/admin/PageHeader.jsx';
import { AdminStatusPill } from '../../components/admin/StatusPill.jsx';
import { Modal } from '../../components/admin/Modal.jsx';
import { formatDate, formatDateTime } from '../../utils/dateFormat.js';
import { mediaUrl } from '../../utils/mediaUrl.js';
import { confirmAction } from '../../utils/confirm.js';
import { showToast } from '../../utils/toast.js';

const STATUSES = ['Pending', 'Approved', 'Rejected'];

function DocumentLink({ label, path }) {
  if (!path) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}: not provided</div>;
  return (
    <a href={mediaUrl(path)} target="_blank" rel="noopener noreferrer" className="doc-thumb">
      <img src={mediaUrl(path)} alt={label} />
      <span>{label}</span>
    </a>
  );
}

function ApplicationModal({ application, onClose, onReviewed }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  async function review(action) {
    if (action === 'approve') {
      const ok = await confirmAction(`Approve ${application.businessName} as a wholesaler?`, { icon: 'question', confirmButtonText: 'Yes, approve' });
      if (!ok) return;
    }
    setSaving(true);
    try {
      await adminWholesalerApi.review(application._id, action, reason);
      showToast('success', action === 'approve' ? 'Application approved - the account is now a wholesaler.' : 'Application rejected.');
      onReviewed();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  }

  const isPending = application.status === 'Pending';

  return (
    <Modal
      title="Wholesaler Application"
      onClose={onClose}
      footer={
        isPending &&
        (rejecting ? (
          <>
            <button className="btn btn-outline" onClick={() => setRejecting(false)}>
              Back
            </button>
            <button className="btn btn-primary" style={{ background: '#DC2626' }} disabled={saving || !reason.trim()} onClick={() => review('reject')}>
              Confirm Rejection
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-outline text-danger" onClick={() => setRejecting(true)}>
              <i className="fas fa-times" /> Reject
            </button>
            <button className="btn btn-primary" disabled={saving} onClick={() => review('approve')}>
              <i className="fas fa-check" /> Approve
            </button>
          </>
        ))
      }
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{application.businessName}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Submitted {formatDateTime(application.createdAt)}</div>
        </div>
        <AdminStatusPill status={application.status} />
      </div>

      <div className="detail-grid">
        <span>Applicant</span>
        <strong>{application.fullName}</strong>
        <span>Contact Number</span>
        <strong>{application.contactNumber}</strong>
        <span>Email</span>
        <strong>{application.email}</strong>
        <span>Business Address</span>
        <strong>{application.businessAddress}</strong>
        <span>Account</span>
        <strong>
          {application.user?.firstName} {application.user?.lastName}
        </strong>
      </div>

      <div style={{ fontWeight: 700, margin: '20px 0 10px' }}>Documents</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <DocumentLink label="Valid ID" path={application.validIdImage} />
        <DocumentLink label="Business Registration" path={application.businessPermitImage} />
        <DocumentLink label="Proof of Business" path={application.proofOfBusinessImage} />
      </div>

      {application.status === 'Rejected' && (
        <div className="alert-inline" style={{ marginTop: 20 }}>
          <strong>Rejection reason:</strong> {application.rejectionReason}
        </div>
      )}

      {isPending && rejecting && (
        <div style={{ marginTop: 20 }}>
          <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
            Reason for rejection (shown to the applicant)
          </label>
          <textarea className="form-control" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
        </div>
      )}
    </Modal>
  );
}

export default function WholesalerApplications() {
  const [status, setStatus] = useState('Pending');
  const [applications, setApplications] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [selected, setSelected] = useState(null);

  function load() {
    adminWholesalerApi.list(status ? { status } : {}).then((data) => {
      setApplications(data.applications);
      setPendingCount(data.pendingCount);
    });
  }
  useEffect(load, [status]);

  return (
    <>
      <PageHeader title="Wholesaler Applications" subtitle="Review customers applying for wholesale accounts." />

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 15 }}>
          <span className="status-pill status-pending">{pendingCount} awaiting review</span>
          <div className="status-filter-row">
            {STATUSES.map((s) => (
              <button key={s} type="button" className={`status-filter-pill ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
                {s}
              </button>
            ))}
            <button type="button" className={`status-filter-pill ${status === '' ? 'active' : ''}`} onClick={() => setStatus('')}>
              All
            </button>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Business</th>
                <th>Applicant</th>
                <th>Contact</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a._id}>
                  <td style={{ fontWeight: 600 }}>{a.businessName}</td>
                  <td>{a.fullName}</td>
                  <td>{a.contactNumber}</td>
                  <td>{formatDate(a.createdAt)}</td>
                  <td>
                    <AdminStatusPill status={a.status} />
                  </td>
                  <td>
                    <button className="btn btn-icon btn-outline" title="Review" onClick={() => setSelected(a)}>
                      <i className="far fa-eye" />
                    </button>
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                    No applications here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <ApplicationModal
          application={selected}
          onClose={() => setSelected(null)}
          onReviewed={() => {
            setSelected(null);
            load();
          }}
        />
      )}
    </>
  );
}
