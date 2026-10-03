import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../../api/products.js';
import { ProductCard } from '../../components/site/ProductCard.jsx';
import { useSiteSettings } from '../../context/SiteSettingsContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

// Photos live in client/public/images/. Until a file is added, its slot just
// falls back to the plain look (gradient hero / icon-only category card).
const HERO_IMAGE = '/images/hero.jpg';

const CATEGORIES = [
  { to: '/shop?category=Fresh', title: 'Fresh Produce', subtitle: 'Mushrooms & mangoes', icon: 'fa-leaf', image: '/images/category-fresh.jpg', iconBg: 'var(--success-bg)', iconColor: 'var(--success-text)' },
  { to: '/shop?category=Value-Added', title: 'Value-Added', subtitle: 'Mokusaku, jams & more', icon: 'fa-flask', image: '/images/category-value-added.jpg', iconBg: 'var(--warning-bg)', iconColor: 'var(--warning-text)' },
  { to: '/shop?category=Farm+Inputs', title: 'Farm Inputs', subtitle: 'Grow bags & soil mix', icon: 'fa-seedling', image: '/images/category-farm-inputs.jpg', iconBg: '#DBEAFE', iconColor: '#1E40AF' },
];

// Hide the whole image slot (not just the <img>) so a missing photo leaves no empty box.
function hideOnError(e) {
  e.currentTarget.parentElement.style.display = 'none';
}

export default function Home() {
  const settings = useSiteSettings();
  const { user } = useAuth();
  const [harvestedToday, setHarvestedToday] = useState([]);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    productsApi.harvestedToday().then((data) => setHarvestedToday(data.items));
    productsApi.featured().then((data) => setFeatured(data.items));
  }, []);

  return (
    <div className="container">
      <section className="hero-section">
        <div className="hero-media">
          <img src={HERO_IMAGE} alt="" onError={hideOnError} />
        </div>
        <div className="hero-content">
          {harvestedToday.length > 0 && (
            <div className="harvest-strip mb-3 d-inline-flex">
              <i className="fas fa-seedling" />
              Harvested Today: {harvestedToday.map((p) => p.name).join(', ')}
            </div>
          )}
          <h1>Premium Quality, Naturally Grown</h1>
          <p>
            Fresh mushrooms, mangoes, mokusaku, and farm inputs from our cooperative in Tres Cruces, Tanza, Cavite &mdash; straight
            to your table.
          </p>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/shop" className="btn btn-farm-amber">
              Shop Now <i className="fas fa-arrow-right ms-1" />
            </Link>
            <Link
              to="/wholesale"
              className="btn btn-farm-outline"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
            >
              Wholesale Inquiry
            </Link>
          </div>
          <div className="social-pills">
            <a href={settings.facebookUrl || '#'} target="_blank" rel="noopener noreferrer" className="social-pill">
              <i className="fab fa-facebook" /> Facebook Page
            </a>
            <a href={settings.shopeeUrl || '#'} target="_blank" rel="noopener noreferrer" className="social-pill">
              <i className="fas fa-shopping-bag" /> Shopee Store
            </a>
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="row g-3">
          {CATEGORIES.map((c) => (
            <div className="col-md-4" key={c.title}>
              <Link to={c.to} className="farm-card category-card text-decoration-none">
                <div className="category-card-img">
                  <img src={c.image} alt={c.title} onError={hideOnError} />
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="category-icon" style={{ background: c.iconBg, color: c.iconColor }}>
                    <i className={`fas ${c.icon}`} />
                  </div>
                  <div>
                    <div className="fw-bold text-dark">{c.title}</div>
                    <div className="small text-muted">{c.subtitle}</div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="section-title">Featured Products</h2>
        <p className="section-subtitle">Fresh from the farm, added recently to our catalog.</p>

        <div className="row g-4">
          {featured.map((p) => (
            <div className="col-6 col-md-4 col-lg-3" key={p._id}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>

        <div className="text-center mt-4">
          {user ? (
            <Link to="/shop" className="btn btn-farm-primary">
              View Full Catalog <i className="fas fa-arrow-right ms-1" />
            </Link>
          ) : (
            <div className="farm-card d-inline-block px-4">
              <p className="mb-2 fw-bold">Want to see all our products?</p>
              <p className="small text-muted mb-3">Log in or create a free account to browse the full catalog and start ordering.</p>
              <div className="d-flex justify-content-center gap-2">
                <Link to="/login" className="btn btn-farm-outline">
                  Log In
                </Link>
                <Link to="/register" className="btn btn-farm-primary">
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
