import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../api/auth.js';
import { showToast } from '../../utils/toast.js';
import { PasswordInput, PasswordHints } from '../../components/site/PasswordInput.jsx';

function ProfileForm({ user, onSaved }) {
  const { updateProfile } = useAuth();
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    contactNumber: user.contactNumber || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await updateProfile(form);
      showToast('success', 'Profile updated.');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label className="form-label">First Name</label>
          <input className="form-control" value={form.firstName} onChange={update('firstName')} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Last Name</label>
          <input className="form-control" value={form.lastName} onChange={update('lastName')} required />
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label">Contact Number</label>
        <input className="form-control" placeholder="09xx xxx xxxx" value={form.contactNumber} onChange={update('contactNumber')} />
      </div>
      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-farm-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button type="button" className="btn btn-farm-outline" onClick={onSaved}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function ChangePasswordForm() {
  const empty = { currentPassword: '', newPassword: '', confirmPassword: '' };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await authApi.changePassword(form);
      showToast('success', 'Password changed.');
      setForm(empty);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="mb-3">
        <label className="form-label">Current Password</label>
        <PasswordInput value={form.currentPassword} onChange={update('currentPassword')} required />
      </div>
      <div className="row g-3 mb-2">
        <div className="col-md-6">
          <label className="form-label">New Password</label>
          <PasswordInput minLength={8} value={form.newPassword} onChange={update('newPassword')} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Confirm New Password</label>
          <PasswordInput minLength={8} value={form.confirmPassword} onChange={update('confirmPassword')} required />
        </div>
      </div>
      <div className="mb-3">
        <PasswordHints password={form.newPassword} confirmPassword={form.confirmPassword} />
      </div>
      <button type="submit" className="btn btn-farm-primary" disabled={saving}>
        {saving ? 'Updating...' : 'Update Password'}
      </button>
      <span className="small text-muted ms-3">
        Forgot it? <Link to="/forgot-password">Reset by email</Link>
      </span>
    </form>
  );
}

export default function Account() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  if (!user) return null;

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <div className="container" style={{ maxWidth: 720, paddingTop: 30, paddingBottom: 60 }}>
      <h2 className="section-title">My Account</h2>
      <p className="section-subtitle">Manage your profile and account settings.</p>

      <div className="farm-card mb-4">
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="profile-avatar">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div className="flex-grow-1">
            <div className="fw-bold fs-5">{fullName}</div>
            <div className="small text-muted">{user.email}</div>
          </div>
          {!editing && (
            <button type="button" className="btn btn-farm-outline btn-sm" onClick={() => setEditing(true)}>
              <i className="fas fa-pen me-1" />Edit Profile
            </button>
          )}
        </div>

        {editing ? (
          <ProfileForm user={user} onSaved={() => setEditing(false)} />
        ) : (
          <div className="row g-3">
            <div className="col-md-6">
              <div className="small text-muted">Name</div>
              <div className="fw-bold">{fullName}</div>
            </div>
            <div className="col-md-6">
              <div className="small text-muted">Contact Number</div>
              <div className="fw-bold">{user.contactNumber || '—'}</div>
            </div>
            <div className="col-md-6">
              <div className="small text-muted">Email</div>
              <div className="fw-bold">{user.email}</div>
            </div>
          </div>
        )}
      </div>

      <div className="farm-card mb-4">
        <h5 className="fw-bold mb-3">
          <i className="fas fa-lock me-2" />Change Password
        </h5>
        <ChangePasswordForm />
      </div>

      <div className="d-flex flex-wrap gap-2">
        <Link to="/loyalty" className="btn btn-farm-outline">
          <i className="fas fa-award me-2" />Loyalty & Vouchers
        </Link>
        <Link to="/track-order" className="btn btn-farm-outline">
          <i className="fas fa-truck me-2" />My Orders
        </Link>
      </div>
    </div>
  );
}
