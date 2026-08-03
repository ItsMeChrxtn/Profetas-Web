import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { showToast } from '../../utils/toast.js';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', contactNumber: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      const newUser = await register(form);
      showToast('success', `Welcome to Profetas Farm, ${newUser.firstName}!`);
      navigate(location.state?.from?.pathname || '/');
    } catch (err) {
      setErrors(err.errors || [err.message]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520, paddingTop: 40, paddingBottom: 60 }}>
      <div className="farm-card">
        <h2 className="section-title text-center">Create an Account</h2>
        <p className="section-subtitle text-center">Join Profetas Farm to order, track deliveries, and earn loyalty vouchers.</p>

        {errors.length > 0 && (
          <div className="alert alert-danger">
            <ul className="mb-0">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label">First Name</label>
              <input type="text" className="form-control" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Last Name</label>
              <input type="text" className="form-control" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-control" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Contact Number</label>
            <input
              type="text"
              className="form-control"
              placeholder="09xx xxx xxxx"
              value={form.contactNumber}
              onChange={(e) => update('contactNumber', e.target.value)}
            />
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                minLength={8}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-control"
                minLength={8}
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-farm-primary w-100" disabled={submitting}>
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-3 mb-0 small">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
