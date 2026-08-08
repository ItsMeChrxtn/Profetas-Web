import { useEffect, useState } from 'react';
import { adminFarmVisitsApi } from '../../api/admin/farmVisits.js';
import { PageHeader } from '../../components/admin/PageHeader.jsx';
import { AdminStatusPill } from '../../components/admin/StatusPill.jsx';
import { formatDate, formatTime } from '../../utils/dateFormat.js';
import { showToast } from '../../utils/toast.js';
import { confirmAction } from '../../utils/confirm.js';

const STATUSES = ['Pending', 'Confirmed', 'Cancelled'];

export default function FarmVisits() {
  const [visits, setVisits] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  function reload() {
    adminFarmVisitsApi.list().then((data) => setVisits(data.visits));
  }

  useEffect(reload, []);

  const filteredVisits = statusFilter ? visits.filter((v) => v.status === statusFilter) : visits;

  async function handleStatusChange(visit, status) {
    const confirmed = await confirmAction(`Change this visit's status to "${status}"?`, {
      icon: 'question',
      confirmButtonText: `Yes, mark as ${status}`,
    });
    if (!confirmed) {
      reload(); // re-sync the <select> back to the actual current status
      return;
    }

    try {
      await adminFarmVisitsApi.updateStatus(visit._id, status);
      showToast('success', `Visit status updated to ${status}.`);
      reload();
    } catch (err) {
      showToast('error', err.message);
    }
  }

  return (
    <>
      <PageHeader title="Farm Visits" subtitle="Review and confirm scheduled farm visit requests." />

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 15 }}>
          <h3 className="card-title">
            <i className="fas fa-tractor" /> Farm Visit Requests
          </h3>
          <div className="status-filter-row">
            <button type="button" className={`status-filter-pill ${statusFilter === '' ? 'active' : ''}`} onClick={() => setStatusFilter('')}>
              All
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className={`status-filter-pill ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
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
                <th>Visit Date</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Visitors</th>
                <th>Notes</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisits.map((visit) => (
                <tr key={visit._id}>
                  <td style={{ fontWeight: 600 }}>
                    {formatDate(visit.visitDate)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{formatTime(visit.visitTime)}</span>
                  </td>
                  <td>{visit.name}</td>
                  <td>{visit.contactNumber}</td>
                  <td>{visit.numberOfVisitors}</td>
                  <td style={{ maxWidth: 200, fontSize: 12, color: 'var(--text-muted)' }}>{visit.notes || '—'}</td>
                  <td>
                    <AdminStatusPill status={visit.status} />
                  </td>
                  <td>
                    <select
                      className="form-control"
                      style={{ width: 130, fontSize: 12 }}
                      value={visit.status}
                      onChange={(e) => handleStatusChange(visit, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {filteredVisits.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                    {visits.length === 0 ? 'No farm visit requests yet.' : 'No farm visit requests match this filter.'}
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
