import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop' },
  { to: '/wholesale', label: 'Wholesale' },
  { to: '/education', label: 'Learn' },
  { to: '/farm-visit', label: 'Visit the Farm' },
  { to: '/track-order', label: 'Track Order' },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <nav className="site-navbar">
      <div className="container">
        <div className="d-flex align-items-center justify-content-between">
          <Link to="/" className="brand-logo">
            <span className="logo-icon">
              <i className="fas fa-leaf" />
            </span>
            <span>PROFETAS FARM</span>
          </Link>

          <button className="btn d-lg-none" type="button" onClick={() => setMenuOpen((v) => !v)}>
            <i className="fas fa-bars fa-lg" />
          </button>

          <div className={`collapse navbar-collapse d-lg-flex flex-grow-1 justify-content-between ${menuOpen ? 'show' : ''}`}>
            <ul className="nav ms-lg-4">
              {NAV_LINKS.map((link) => (
                <li className="nav-item" key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0">
              <Link to="/cart" className="text-dark position-relative cart-badge-wrap" title="Cart">
                <i className="fas fa-shopping-basket fa-lg" />
                <span className="cart-count-badge" style={{ display: count > 0 ? undefined : 'none' }}>
                  {count}
                </span>
              </Link>

              {user ? (
                <div className="dropdown">
                  <button type="button" className="btn btn-farm-outline dropdown-toggle" onClick={() => setProfileOpen((v) => !v)}>
                    <i className="fas fa-user-circle" /> {user.firstName}
                  </button>
                  {profileOpen && (
                    <ul className="dropdown-menu dropdown-menu-end show" style={{ position: 'absolute', right: 0 }}>
                      <li>
                        <Link className="dropdown-item" to="/account" onClick={() => setProfileOpen(false)}>
                          <i className="fas fa-id-card me-2" />My Account
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/loyalty" onClick={() => setProfileOpen(false)}>
                          <i className="fas fa-award me-2" />Loyalty & Vouchers
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/track-order" onClick={() => setProfileOpen(false)}>
                          <i className="fas fa-truck me-2" />My Orders
                        </Link>
                      </li>
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <button className="dropdown-item text-danger" onClick={() => { setProfileOpen(false); logout(); }}>
                          <i className="fas fa-sign-out-alt me-2" />Logout
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn btn-farm-outline">Login</Link>
                  <Link to="/register" className="btn btn-farm-primary">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
