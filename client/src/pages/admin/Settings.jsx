import { useEffect, useState } from 'react';
import { adminSettingsApi } from '../../api/admin/settings.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { PageHeader } from '../../components/admin/PageHeader.jsx';
import { showToast } from '../../utils/toast.js';

export default function Settings() {
  const { user } = useAuth();

  const [siteSettings, setSiteSettings] = useState(null);
  const [savingSite, setSavingSite] = useState(false);

  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', contactNumber: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    adminSettingsApi.get().then((data) => setSiteSettings(data.settings));
    adminSettingsApi.getProfile().then((data) => setProfile(data.user));
  }, []);

  async function handleSiteSettingsSubmit(e) {
    e.preventDefault();
    setSavingSite(true);
    try {
      const data = await adminSettingsApi.update(siteSettings);
      setSiteSettings(data.settings);
      showToast('success', 'Site settings saved.');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSavingSite(false);
    }
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await adminSettingsApi.updateProfile(profile);
      showToast('success', 'Profile updated.');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await adminSettingsApi.changePassword(passwordForm);
      showToast('success', 'Password updated.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSavingPassword(false);
    }
  }

  if (!siteSettings) return null;

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Admin';

  return (
    <>
      <PageHeader title="Settings" subtitle="Configure your farm profile, site settings, and account security." />

      <div className="settings-content">
        <div className="card" id="profile">
          <div className="card-header">
            <h3 className="card-title">Profile Settings</h3>
          </div>
          <form onSubmit={handleProfileSubmit}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 25, marginBottom: 30 }}>
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=7B1E2B&color=fff&size=100`}
                style={{ width: 100, height: 100, borderRadius: '50%' }}
                alt={displayName}
              />
              <div>
                <h4 style={{ fontSize: 18, fontWeight: 700 }}>{displayName}</h4>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Manage your admin account details.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20 }}>
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={profile.firstName}
                  onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={profile.lastName}
                  onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-control"
                required
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Contact Number</label>
              <input
                type="text"
                className="form-control"
                value={profile.contactNumber || ''}
                onChange={(e) => setProfile((p) => ({ ...p, contactNumber: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        <div className="card" id="site-settings" style={{ marginTop: 30 }}>
          <div className="card-header">
            <h3 className="card-title">Site Settings</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: -10 }}>
            Controls the live chat status, social links, and GCash number shown on the customer site.
          </p>
          <form onSubmit={handleSiteSettingsSubmit}>
            <div className="form-group">
              <label>Live Chat Status</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15, padding: 15, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: siteSettings.chatStatus === 'online' ? '#22C55E' : '#9CA3AF' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>Currently: {siteSettings.chatStatus === 'online' ? 'Online' : 'Offline'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {siteSettings.chatStatus === 'online' ? 'Customers see the chat bubble as active.' : 'Customers see the chat bubble as offline.'}
                  </div>
                </div>
                <button
                  type="button"
                  className={`btn ${siteSettings.chatStatus === 'online' ? 'btn-outline' : 'btn-primary'}`}
                  onClick={() => setSiteSettings((s) => ({ ...s, chatStatus: s.chatStatus === 'online' ? 'offline' : 'online' }))}
                >
                  <i className="fas fa-power-off" /> Switch to {siteSettings.chatStatus === 'online' ? 'Offline' : 'Online'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Facebook URL</label>
              <input
                type="text"
                className="form-control"
                value={siteSettings.facebookUrl}
                onChange={(e) => setSiteSettings((s) => ({ ...s, facebookUrl: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Shopee URL</label>
              <input
                type="text"
                className="form-control"
                value={siteSettings.shopeeUrl}
                onChange={(e) => setSiteSettings((s) => ({ ...s, shopeeUrl: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>GCash Number</label>
              <input
                type="text"
                className="form-control"
                value={siteSettings.gcashNumber}
                onChange={(e) => setSiteSettings((s) => ({ ...s, gcashNumber: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="submit" className="btn btn-primary" disabled={savingSite}>
                {savingSite ? 'Saving...' : 'Save Site Settings'}
              </button>
            </div>
          </form>
        </div>

        <div className="card" id="security" style={{ marginTop: 30 }}>
          <div className="card-header">
            <h3 className="card-title">Security</h3>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                className="form-control"
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20 }}>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  className="form-control"
                  required
                  minLength={8}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  required
                  minLength={8}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
