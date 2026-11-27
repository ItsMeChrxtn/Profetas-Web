import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { farmVisitsApi } from '../../api/farmVisits.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { todayDateString, formatDate } from '../../utils/dateFormat.js';
import { VisitCalendar } from '../../components/VisitCalendar.jsx';
import { digitsOnly, blockNonDigitKeys } from '../../utils/digits.js';

const MAX_VISITORS = 100;

// Every 30 minutes from 7:00 AM to 5:00 PM.
const TIME_SLOTS = Array.from({ length: 21 }, (_, i) => {
  const minutes = 7 * 60 + i * 30;
  const value = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  const h = Math.floor(minutes / 60);
  const label = `${h % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  return { value, label };
});

export default function FarmVisit() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.firstName ? `${user.firstName} ${user.lastName}` : '',
    // Taken from the account; still editable for this request.
    contactNumber: digitsOnly(user?.contactNumber, 11),
    visitDate: '',
    visitTime: '',
    numberOfVisitors: '1',
    notes: '',
  });
  const [errors, setErrors] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Days that already have a confirmed visit - shown as occupied and not bookable.
  const [occupied, setOccupied] = useState(new Set());

  useEffect(() => {
    farmVisitsApi.occupied().then((data) => setOccupied(new Set(data.dates)));
  }, []);

  const today = todayDateString();
  function dayInfo(date) {
    if (date < today) return { className: 'past', disabled: true };
    if (occupied.has(date)) return { className: 'occupied', disabled: true, badge: 'Booked', title: 'Already booked' };
    return {};
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    if (!form.visitDate) {
      setErrors(['Please pick a visit date on the calendar.']);
      return;
    }
    setSubmitting(true);
    try {
      await farmVisitsApi.submit(form);
      setSubmitted(true);
    } catch (err) {
      setErrors([err.message]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 720, paddingTop: 30, paddingBottom: 60 }}>
      <h2 className="section-title">Schedule a Farm Visit</h2>
      <p className="section-subtitle">
        Come see how we grow our mushrooms, mangoes, and more at Profetas Integrated Farm, Tres Cruces, Tanza, Cavite.
      </p>

      {submitted ? (
        <div className="farm-card text-center py-5">
          <i className="fas fa-tractor fa-2x mb-3" style={{ color: 'var(--primary-green)' }} />
          <h4 className="fw-bold">Visit Request Sent!</h4>
          <p className="text-muted">We'll contact you to confirm your schedule.</p>
          {user ? (
            <Link to="/my-farm-visits" className="btn btn-farm-primary mt-2">
              View My Requests
            </Link>
          ) : (
            <Link to="/" className="btn btn-farm-primary mt-2">
              Back to Home
            </Link>
          )}
        </div>
      ) : (
        <div className="farm-card">
          {errors.length > 0 && (
            <div className="alert alert-danger">
              {errors.map((error, i) => (
                <div key={i}>{error}</div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-control" value={form.name} onChange={(e) => update('name', e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Contact Number</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={11}
                className="form-control"
                placeholder="09XXXXXXXXX"
                value={form.contactNumber}
                onChange={(e) => update('contactNumber', digitsOnly(e.target.value, 11))}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">
                Visit Date{' '}
                <span className="text-muted fw-normal">{form.visitDate ? `- ${formatDate(form.visitDate)}` : '(pick an available day)'}</span>
              </label>
              <VisitCalendar selected={form.visitDate} onSelect={(date) => update('visitDate', date)} dayInfo={dayInfo} />
              <div className="visit-calendar-legend">
                <span style={{ '--swatch': '#fff', border: 0 }}>Available</span>
                <span style={{ '--swatch': '#FEE2E2' }}>Occupied</span>
                <span style={{ '--swatch': '#7B1E2B' }}>Your pick</span>
              </div>
            </div>
            <div className="row g-3">
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  Visit Time <span className="text-muted fw-normal">(7:00 AM - 5:00 PM)</span>
                </label>
                <select className="form-select" value={form.visitTime} onChange={(e) => update('visitTime', e.target.value)} required>
                  <option value="" disabled>
                    Choose a time
                  </option>
                  {TIME_SLOTS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  Number of Visitors <span className="text-muted fw-normal">(max {MAX_VISITORS})</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  min={1}
                  max={MAX_VISITORS}
                  value={form.numberOfVisitors}
                  onKeyDown={blockNonDigitKeys}
                  onChange={(e) => update('numberOfVisitors', e.target.value === '' ? '' : String(Math.min(MAX_VISITORS, Math.max(1, parseInt(e.target.value, 10) || 1))))}
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label">Notes (optional)</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Anything we should know? (e.g. school group, accessibility needs)"
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-farm-primary w-100" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Request Visit'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
