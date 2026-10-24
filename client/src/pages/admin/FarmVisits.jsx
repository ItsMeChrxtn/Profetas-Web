import { useEffect, useMemo, useState } from 'react';
import { adminFarmVisitsApi } from '../../api/admin/farmVisits.js';
import { PageHeader } from '../../components/admin/PageHeader.jsx';
import { AdminStatusPill } from '../../components/admin/StatusPill.jsx';
import { Modal } from '../../components/admin/Modal.jsx';
import { VisitCalendar } from '../../components/VisitCalendar.jsx';
import { formatDate, formatTime, todayDateString } from '../../utils/dateFormat.js';
import { showToast } from '../../utils/toast.js';

const STATUSES = ['Pending', 'Confirmed', 'Cancelled'];

/** Review one request: details, the month around it, and Confirm / Cancel. */
function ReviewVisitModal({ visit, visitsByDate, onClose, onUpdated }) {
  const [saving, setSaving] = useState(null);
  const sameDay = (visitsByDate.get(visit.visitDate) || []).filter((v) => v._id !== visit._id);
  const otherConfirmed = sameDay.find((v) => v.status === 'Confirmed');

  async function setStatus(status) {
    setSaving(status);
    try {
      await adminFarmVisitsApi.updateStatus(visit._id, status);
      showToast('success', `Visit marked as ${status}.`);
      onUpdated();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <Modal
      size="lg"
      title="Review Farm Visit"
      onClose={onClose}
      footer={
        <>
          {visit.status !== 'Cancelled' && (
            <button className="btn btn-outline text-danger" disabled={saving !== null} onClick={() => setStatus('Cancelled')}>
              <i className="fas fa-times" /> {saving === 'Cancelled' ? 'Cancelling...' : 'Cancel Visit'}
            </button>
          )}
          {visit.status !== 'Pending' && (
            <button className="btn btn-outline" disabled={saving !== null} onClick={() => setStatus('Pending')}>
              Set to Pending
            </button>
          )}
          {visit.status !== 'Confirmed' && (
            <button className="btn btn-primary" disabled={saving !== null || Boolean(otherConfirmed)} onClick={() => setStatus('Confirmed')}>
              <i className="fas fa-check" /> {saving === 'Confirmed' ? 'Confirming...' : 'Confirm Visit'}
            </button>
          )}
        </>
      }
    >
      <div className="farm-visit-review">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <div style={{ fontWeight: 800, fontSize: 17 }}>{visit.name}</div>
            <AdminStatusPill status={visit.status} />
          </div>
          <div className="detail-grid">
            <span>Date</span>
            <strong>{formatDate(visit.visitDate)}</strong>
            <span>Time</span>
            <strong>{formatTime(visit.visitTime)}</strong>
            <span>Visitors</span>
            <strong>{visit.numberOfVisitors}</strong>
            <span>Contact</span>
            <strong>{visit.contactNumber}</strong>
            <span>Notes</span>
            <strong>{visit.notes || '—'}</strong>
          </div>
          {otherConfirmed && (
            <div className="alert-inline" style={{ marginTop: 15 }}>
              {otherConfirmed.name}'s visit is already confirmed on this date. Cancel or move that one first to confirm this request.
            </div>
          )}
          {!otherConfirmed && sameDay.length > 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 15 }}>
              {sameDay.length} other request{sameDay.length > 1 ? 's' : ''} on this date. Confirming this one marks the day as booked for customers.
            </p>
          )}
        </div>
        <VisitCalendar
          initialDate={visit.visitDate}
          selected={visit.visitDate}
          dayInfo={(date) => {
            const list = visitsByDate.get(date) || [];
            if (list.some((v) => v.status === 'Confirmed')) return { className: 'has-confirmed', badge: 'Booked' };
            if (list.some((v) => v.status === 'Pending')) return { className: 'has-pending', badge: list.length };
            return {};
          }}
        />
      </div>
    </Modal>
  );
}

export default function FarmVisits() {
  const [visits, setVisits] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [reviewing, setReviewing] = useState(null);

  function reload() {
    adminFarmVisitsApi.list().then((data) => setVisits(data.visits));
  }

  useEffect(reload, []);

  // Cancelled requests don't take up a day on the calendar.
  const visitsByDate = useMemo(() => {
    const map = new Map();
    for (const v of visits) {
      if (v.status === 'Cancelled') continue;
      map.set(v.visitDate, [...(map.get(v.visitDate) || []), v]);
    }
    return map;
  }, [visits]);

  const today = todayDateString();
  const filteredVisits = visits.filter((v) => (!statusFilter || v.status === statusFilter) && (!selectedDate || v.visitDate === selectedDate));

  return (
    <>
      <PageHeader title="Farm Visits" subtitle="Review and confirm scheduled farm visit requests." />

      <div className="dashboard-row cols-wide-2-1" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 15 }}>
            <h3 className="card-title">
              <i className="fas fa-tractor" /> {selectedDate ? `Requests on ${formatDate(selectedDate)}` : 'Farm Visit Requests'}
            </h3>
            <div className="status-filter-row">
              <button type="button" className={`status-filter-pill ${statusFilter === '' ? 'active' : ''}`} onClick={() => setStatusFilter('')}>
                All
              </button>
              {STATUSES.map((s) => (
                <button key={s} type="button" className={`status-filter-pill ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                  {s}
                </button>
              ))}
              {selectedDate && (
                <button type="button" className="status-filter-pill" onClick={() => setSelectedDate(null)}>
                  <i className="fas fa-times" /> All dates
                </button>
              )}
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Visit Date</th>
                  <th>Name</th>
                  <th>Visitors</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisits.map((visit) => (
                  <tr key={visit._id}>
                    <td style={{ fontWeight: 600 }}>
                      {formatDate(visit.visitDate)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{formatTime(visit.visitTime)}</span>
                    </td>
                    <td>
                      {visit.name}
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{visit.contactNumber}</div>
                    </td>
                    <td>{visit.numberOfVisitors}</td>
                    <td>
                      <AdminStatusPill status={visit.status} />
                    </td>
                    <td>
                      <button className="btn btn-outline" style={{ padding: '6px 12px' }} onClick={() => setReviewing(visit)}>
                        <i className="far fa-calendar-check" /> Review
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredVisits.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                      {visits.length === 0 ? 'No farm visit requests yet.' : 'No farm visit requests match this filter.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="far fa-calendar-alt" /> Calendar
            </h3>
          </div>
          <VisitCalendar
            selected={selectedDate}
            onSelect={(date) => setSelectedDate((d) => (d === date ? null : date))}
            dayInfo={(date) => {
              const list = visitsByDate.get(date) || [];
              if (list.some((v) => v.status === 'Confirmed')) return { className: 'has-confirmed', badge: 'Booked' };
              if (list.length) return { className: 'has-pending', badge: `${list.length} req` };
              return { className: date < today ? 'past' : '' };
            }}
          />
          <div className="visit-calendar-legend">
            <span style={{ '--swatch': '#DCFCE7' }}>Confirmed</span>
            <span style={{ '--swatch': '#FEF3C7' }}>Pending requests</span>
          </div>
        </div>
      </div>

      {reviewing && (
        <ReviewVisitModal
          visit={reviewing}
          visitsByDate={visitsByDate}
          onClose={() => setReviewing(null)}
          onUpdated={() => {
            setReviewing(null);
            reload();
          }}
        />
      )}
    </>
  );
}
