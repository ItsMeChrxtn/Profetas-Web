import { useEffect, useState } from 'react';
import { adminFarmVisitsApi } from '../../api/admin/farmVisits.js';
import { PageHeader } from '../../components/admin/PageHeader.jsx';
import { formatDate, formatTime } from '../../utils/dateFormat.js';
import { showToast } from '../../utils/toast.js';

const STATUSES = ['Pending', 'Confirmed', 'Cancelled'];

function statusClass(status) {
  if (status === 'Confirmed') return 'status-completed';
  if (status === 'Cancelled') return 'status-pending';
  return 'status-processing';
}

export default function FarmVisits() {
  const [visits, setVisits] = useState([]);

  function reload() {
    adminFarmVisitsApi.list().then((data) => setVisits(data.visits));
  }

  useEffect(reload, []);

  async function handleStatusChange(visit, status) {
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
        <div className="card-header">
          <h3 className="card-title">
            <i className="fas fa-tractor" /> Farm Visit Requests
          </h3>
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
              {visits.map((visit) => (
                <tr key={visit._id}>
                  <td style={{ fontWeight: 600 }}>
                    {formatDate(visit.visitDate)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{formatTime(visit.visitTime)}</span>
                  </td>
                  <td>{visit.name}</td>
                  <td>{visit.contactNumber}</td>
                  <td>{visit.numberOfVisitors}</td>
                  <td style={{ maxWidth: 200, fontSize: 12, color: 'var(--text-muted)' }}>{visit.notes || '—'}</td>
                  <td>
                    <span className={`status-pill ${statusClass(visit.status)}`}>{visit.status}</span>
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
              {visits.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                    No farm visit requests yet.
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
