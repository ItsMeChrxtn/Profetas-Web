import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { showToast } from '../../utils/toast.js';
import { PasswordInput, PasswordLengthHint, PasswordMatchHint } from '../../components/site/PasswordInput.jsx';

const RESEND_COOLDOWN_SECONDS = 30;

export default function Register() {
  const { user, register, verifyRegistrationOtp, resendRegistrationOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState('form');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', contactNumber: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (user) return <Navigate to="/" replace />;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      await register(form);
      showToast('success', `We sent a verification code to ${form.email}.`);
      setStep('otp');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setErrors(err.errors || [err.message]);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      const newUser = await verifyRegistrationOtp(form.email, otp);
      showToast('success', `Welcome to Profetas Farm, ${newUser.firstName}!`);
      navigate(location.state?.from?.pathname || '/');
    } catch (err) {
      setErrors([err.message]);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await resendRegistrationOtp(form.email);
      showToast('success', `We sent a new code to ${form.email}.`);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setResending(false);
    }
  }

  if (step === 'otp') {
    return (
      <div className="container" style={{ maxWidth: 460, paddingTop: 40, paddingBottom: 60 }}>
        <div className="farm-card">
          <h2 className="section-title text-center">Check Your Email</h2>
          <p className="section-subtitle text-center">
            We sent a 6-digit verification code to <strong>{form.email}</strong>.
          </p>

          {errors.length > 0 && (
            <div className="alert alert-danger">
              {errors.map((error, i) => (
                <div key={i}>{error}</div>
              ))}
            </div>
          )}

          <form onSubmit={handleVerify}>
            <div className="mb-4">
              <label className="form-label">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="form-control text-center"
                style={{ fontSize: 24, letterSpacing: 8, fontWeight: 700 }}
                placeholder="------"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-farm-primary w-100 mb-3" disabled={submitting || otp.length !== 6}>
              {submitting ? 'Verifying...' : 'Verify & Create Account'}
            </button>
          </form>

          <div className="text-center small">
            {cooldown > 0 ? (
              <span className="text-muted">Resend code in {cooldown}s</span>
            ) : (
              <button type="button" className="btn btn-link p-0" disabled={resending} onClick={handleResend}>
                {resending ? 'Sending...' : "Didn't get the code? Resend"}
              </button>
            )}
          </div>
          <div className="text-center small mt-2">
            <button type="button" className="btn btn-link p-0 text-muted" onClick={() => setStep('form')}>
              Wrong email? Go back
            </button>
          </div>
        </div>
      </div>
    );
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
          <div className="mb-3">
            <label className="form-label">Password</label>
            <PasswordInput minLength={8} value={form.password} onChange={(e) => update('password', e.target.value)} required />
            <PasswordLengthHint password={form.password} />
          </div>
          <div className="mb-4">
            <label className="form-label">Confirm Password</label>
            <PasswordInput
              minLength={8}
              value={form.confirmPassword}
              onChange={(e) => update('confirmPassword', e.target.value)}
              required
            />
            <PasswordMatchHint password={form.password} confirmPassword={form.confirmPassword} />
          </div>
          <button type="submit" className="btn btn-farm-primary w-100" disabled={submitting}>
            {submitting ? 'Sending Code...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-3 mb-0 small">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
