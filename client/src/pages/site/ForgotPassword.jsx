import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../api/auth.js';
import { showToast } from '../../utils/toast.js';
import { PasswordInput, PasswordLengthHint, PasswordMatchHint } from '../../components/site/PasswordInput.jsx';

const RESEND_COOLDOWN_SECONDS = 30;

export default function ForgotPassword() {
  const { user, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (user && step === 'email') return <Navigate to="/account" replace />;

  async function sendCode() {
    setError('');
    setSubmitting(true);
    try {
      const data = await authApi.forgotPassword({ email });
      showToast('success', data.message);
      setStep('reset');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await resetPassword({ email, otp, password, confirmPassword });
      showToast('success', 'Your password has been reset.');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 460, paddingTop: 60, paddingBottom: 80 }}>
      <div className="farm-card">
        <h2 className="section-title text-center">Forgot Password</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        {step === 'email' ? (
          <>
            <p className="section-subtitle text-center">Enter your account email and we'll send you a code to reset your password.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendCode();
              }}
            >
              <div className="mb-4">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </div>
              <button type="submit" className="btn btn-farm-primary w-100" disabled={submitting}>
                {submitting ? 'Sending Code...' : 'Send Reset Code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="section-subtitle text-center">
              Enter the 6-digit code sent to <strong>{email}</strong> and choose a new password.
            </p>
            <form onSubmit={handleReset}>
              <div className="mb-3">
                <label className="form-label">Reset Code</label>
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
              <div className="mb-3">
                <label className="form-label">New Password</label>
                <PasswordInput minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
                <PasswordLengthHint password={password} />
              </div>
              <div className="mb-4">
                <label className="form-label">Confirm New Password</label>
                <PasswordInput minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                <PasswordMatchHint password={password} confirmPassword={confirmPassword} />
              </div>
              <button type="submit" className="btn btn-farm-primary w-100 mb-3" disabled={submitting || otp.length !== 6}>
                {submitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
            <div className="text-center small">
              {cooldown > 0 ? (
                <span className="text-muted">Resend code in {cooldown}s</span>
              ) : (
                <button type="button" className="btn btn-link p-0" disabled={submitting} onClick={sendCode}>
                  Didn't get the code? Resend
                </button>
              )}
            </div>
          </>
        )}

        <p className="text-center mt-3 mb-0 small">
          Remembered it? <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
