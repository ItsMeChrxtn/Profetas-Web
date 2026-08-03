import { useState } from 'react';
import { Link } from 'react-router-dom';
import { wholesaleApi } from '../../api/wholesale.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Wholesale() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.firstName ? `${user.firstName} ${user.lastName}` : '',
    contactNumber: '',
    location: '',
    requestedItems: '',
    estimatedBudget: '',
  });
  const [errors, setErrors] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      await wholesaleApi.submit(form);
      setSubmitted(true);
    } catch (err) {
      setErrors([err.message]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 720, paddingTop: 30, paddingBottom: 60 }}>
      <h2 className="section-title">Wholesale / Reseller Inquiry</h2>
      <p className="section-subtitle">
        Planning a bulk order of &#8369;10,000 or more? Tell us what you need and our team will send you a quotation.
      </p>

      {submitted ? (
        <div className="farm-card text-center py-5">
          <i className="fas fa-check-circle fa-2x mb-3" style={{ color: 'var(--success-text)' }} />
          <h4 className="fw-bold">Inquiry Sent!</h4>
          <p className="text-muted">Thank you for your interest. Our team will contact you with a quotation shortly.</p>
          <Link to="/shop" className="btn btn-farm-primary mt-2">
            Back to Shop
          </Link>
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
              <label className="form-label">Full Name / Business Name</label>
              <input type="text" className="form-control" value={form.name} onChange={(e) => update('name', e.target.value)} required />
            </div>
            <div className="row g-3">
              <div className="col-md-6 mb-3">
                <label className="form-label">Contact Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="09xx xxx xxxx"
                  value={form.contactNumber}
                  onChange={(e) => update('contactNumber', e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Estimated Budget (optional)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 15000"
                  value={form.estimatedBudget}
                  onChange={(e) => update('estimatedBudget', e.target.value)}
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Delivery Location</label>
              <input
                type="text"
                className="form-control"
                placeholder="City / Municipality, Province"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="form-label">Requested Items</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="e.g. 5 sacks Oyster Mushroom, 10 bottles Mokusaku, 3 sacks Carabao Mango"
                value={form.requestedItems}
                onChange={(e) => update('requestedItems', e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-farm-primary w-100" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Inquiry'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
