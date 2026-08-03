import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Account() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="container" style={{ maxWidth: 600, paddingTop: 30, paddingBottom: 60 }}>
      <h2 className="section-title">My Account</h2>
      <p className="section-subtitle">Your Profetas Farm account details.</p>

      <div className="farm-card mb-4">
        <div className="mb-3">
          <div className="small text-muted">Name</div>
          <div className="fw-bold">
            {user.firstName} {user.lastName}
          </div>
        </div>
        <div className="mb-3">
          <div className="small text-muted">Email</div>
          <div className="fw-bold">{user.email}</div>
        </div>
        <div>
          <div className="small text-muted">Contact Number</div>
          <div className="fw-bold">{user.contactNumber || '—'}</div>
        </div>
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
