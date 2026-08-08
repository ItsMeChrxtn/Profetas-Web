import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { farmVisitsApi } from '../../api/farmVisits.js';
import { formatDate, formatTime, formatDateTime } from '../../utils/dateFormat.js';

const STATUSES = ['Pending', 'Confirmed', 'Cancelled'];
const STATUS_ICONS = { Pending: 'fa-clock', Confirmed: 'fa-check-circle', Cancelled: 'fa-times-circle' };
const STATUS_BORDER_VARS = { Pending: '--warning-text', Confirmed: '--primary-green', Cancelled: '--danger-text' };

export default function MyFarmVisits() {
  const [visits, setVisits] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || '';

  useEffect(() => {
    farmVisitsApi.mine().then((data) => setVisits(data.visits));
  }, []);

  if (!visits) return null;

  const filtered = status ? visits.filter((v) => v.status === status) : visits;

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 60 }}>
      <h2 className="section-title">My Farm Visit Requests</h2>
      <p className="section-subtitle">Track the status of the farm visits you've requested.</p>

      {visits.length === 0 ? (
        <div className="farm-card text-center py-5">
          <i className="fas fa-tractor fa-2x mb-3" style={{ color: 'var(--text-muted)' }} />
          <p>You haven't requested a farm visit yet.</p>
          <Link to="/farm-visit" className="btn btn-farm-primary">
            Schedule a Visit
          </Link>
        </div>
      ) : (
        <>
          <div className="d-flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              className={`category-pill ${status === '' ? 'active' : ''}`}
              onClick={() => setSearchParams({})}
              style={{ cursor: 'pointer' }}
            >
              All ({visits.length})
            </button>
            {STATUSES.map((s) => {
              const n = visits.filter((v) => v.status === s).length;
              return (
                <button
                  key={s}
                  type="button"
                  className={`category-pill ${status === s ? 'active' : ''}`}
                  onClick={() => setSearchParams({ status: s })}
                  disabled={n === 0}
                  style={{ cursor: n === 0 ? 'default' : 'pointer', opacity: n === 0 ? 0.45 : 1 }}
                >
                  {s} ({n})
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="farm-card text-center py-5">
              <i className="fas fa-filter fa-2x mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="mb-0">No {status.toLowerCase()} visit requests.</p>
            </div>
          ) : (
            filtered.map((visit) => (
              <div
                className="farm-card mb-4"
                style={{ borderLeft: `4px solid var(${STATUS_BORDER_VARS[visit.status]})` }}
                key={visit._id}
              >
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                  <div>
                    <span className="fw-bold fs-5">
                      <i className="fas fa-calendar-day me-2" style={{ color: 'var(--accent-amber)' }} />
                      {formatDate(visit.visitDate)} at {formatTime(visit.visitTime)}
                    </span>
                  </div>
                  <span className={`status-pill status-${visit.status.toLowerCase()}`}>
                    <i className={`fas ${STATUS_ICONS[visit.status]}`} /> {visit.status}
                  </span>
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="small text-muted mb-1">
                      <i className="fas fa-users me-1" /> Visitors
                    </div>
                    <div className="small fw-bold">{visit.numberOfVisitors}</div>
                  </div>
                  <div className="col-md-4">
                    <div className="small text-muted mb-1">
                      <i className="fas fa-paper-plane me-1" /> Requested
                    </div>
                    <div className="small fw-bold">{formatDateTime(visit.createdAt)}</div>
                  </div>
                  {visit.notes && (
                    <div className="col-md-4">
                      <div className="small text-muted mb-1">
                        <i className="fas fa-sticky-note me-1" /> Notes
                      </div>
                      <div className="small">{visit.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
