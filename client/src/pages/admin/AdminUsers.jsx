import { useEffect, useState } from 'react';
import { adminUsersApi } from '../../api/admin/users.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { PageHeader } from '../../components/admin/PageHeader.jsx';
import { Modal } from '../../components/admin/Modal.jsx';
import { formatDateTime } from '../../utils/dateFormat.js';
import { confirmAction } from '../../utils/confirm.js';
import { showToast } from '../../utils/toast.js';

const ROLE_LABELS = { superadmin: 'Super Admin', admin: 'Admin' };

const ROLE_ACCESS = [
  { role: 'Super Admin', access: 'Everything: adding, editing and archiving products, stock changes, Reports, Product Archive, Wholesaler Applications, managing customers, and User Management.' },
  { role: 'Admin', access: 'Dashboard, Orders, Products and Inventory (view only), Customers (view only), Payments, Delivery Booking, Farm Visits, Education Posts, and Settings including the Landing Page.' },
];

function AddStaffModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'admin' });
  const [saving, setSaving] = useState(false);
  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminUsersApi.create(form);
      showToast('success', 'Staff account created.');
      onSaved();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Add Staff Account"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" form="staffForm" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Create Account'}
          </button>
        </>
      }
    >
      <form id="staffForm" onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
          <div className="form-group">
            <label>First Name</label>
            <input className="form-control" required value={form.firstName} onChange={update('firstName')} />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input className="form-control" required value={form.lastName} onChange={update('lastName')} />
          </div>
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" className="form-control" required value={form.email} onChange={update('email')} />
        </div>
        <div className="form-group">
          <label>Temporary Password (at least 8 characters)</label>
          <input type="text" className="form-control" required minLength={8} value={form.password} onChange={update('password')} />
        </div>
        <div className="form-group">
          <label>Role</label>
          <select className="form-control" value={form.role} onChange={update('role')}>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </select>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [adding, setAdding] = useState(false);

  function load() {
    adminUsersApi.list().then((data) => setUsers(data.users));
  }
  useEffect(load, []);

  async function changeRole(u, role) {
    const label = role === 'customer' ? `Remove admin access from ${u.firstName}?` : `Make ${u.firstName} a ${ROLE_LABELS[role]}?`;
    const ok = await confirmAction(label, { confirmButtonText: 'Yes, continue' });
    if (!ok) return;
    try {
      const res = await adminUsersApi.updateRole(u._id, role);
      showToast('success', res.message);
      load();
    } catch (err) {
      showToast('error', err.message);
    }
  }

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="Staff accounts and what each role can access."
        actions={
          <button className="btn btn-primary" onClick={() => setAdding(true)}>
            <i className="fas fa-user-plus" /> Add Staff
          </button>
        }
      />

      <div className="card" style={{ marginBottom: 30 }}>
        <div className="card-header">
          <h3 className="card-title">
            <i className="fas fa-key" /> Role Access
          </h3>
        </div>
        <div className="detail-grid">
          {ROLE_ACCESS.map((r) => (
            <div key={r.role} style={{ display: 'contents' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{r.role}</span>
              <strong style={{ fontWeight: 400 }}>{r.access}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isMe = u._id === me?.id;
                return (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600 }}>
                      {u.firstName} {u.lastName} {isMe && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(you)</span>}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`status-pill ${u.role === 'superadmin' ? 'status-confirmed' : 'status-pending'}`}>{ROLE_LABELS[u.role]}</span>
                    </td>
                    <td style={{ fontSize: 13 }}>{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Never'}</td>
                    <td>
                      {isMe ? (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-outline"
                            style={{ padding: '6px 10px', fontSize: 12 }}
                            onClick={() => changeRole(u, u.role === 'superadmin' ? 'admin' : 'superadmin')}
                          >
                            Make {u.role === 'superadmin' ? 'Admin' : 'Super Admin'}
                          </button>
                          <button className="btn btn-outline text-danger" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => changeRole(u, 'customer')}>
                            Remove Access
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {adding && (
        <AddStaffModal
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
          }}
        />
      )}
    </>
  );
}
