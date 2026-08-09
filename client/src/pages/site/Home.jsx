import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../../api/products.js';
import { ProductCard } from '../../components/site/ProductCard.jsx';
import { useSiteSettings } from '../../context/SiteSettingsContext.jsx';

export default function Home() {
  const settings = useSiteSettings();
  const [harvestedToday, setHarvestedToday] = useState([]);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    productsApi.harvestedToday().then((data) => setHarvestedToday(data.items));
    productsApi.featured().then((data) => setFeatured(data.items));
  }, []);

  return (
    <div className="container">
      <section className="hero-section">
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
          <div className="col-md-4">
            <Link to="/shop?category=Fresh" className="farm-card d-flex align-items-center gap-3 text-decoration-none">
              <div
                className="logo-icon"
                style={{ width: 50, height: 50, background: 'var(--success-bg)', color: 'var(--success-text)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}
              >
                <i className="fas fa-leaf" />
              </div>
              <div>
                <div className="fw-bold text-dark">Fresh Produce</div>
                <div className="small text-muted">Mushrooms &amp; mangoes</div>
              </div>
            </Link>
          </div>
          <div className="col-md-4">
            <Link to="/shop?category=Value-Added" className="farm-card d-flex align-items-center gap-3 text-decoration-none">
              <div
                className="logo-icon"
                style={{ width: 50, height: 50, background: 'var(--warning-bg)', color: 'var(--warning-text)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}
              >
                <i className="fas fa-flask" />
              </div>
              <div>
                <div className="fw-bold text-dark">Value-Added</div>
                <div className="small text-muted">Mokusaku, jams &amp; more</div>
              </div>
            </Link>
          </div>
          <div className="col-md-4">
            <Link to="/shop?category=Farm+Inputs" className="farm-card d-flex align-items-center gap-3 text-decoration-none">
              <div
                className="logo-icon"
                style={{ width: 50, height: 50, background: '#DBEAFE', color: '#1E40AF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}
              >
                <i className="fas fa-seedling" />
              </div>
              <div>
                <div className="fw-bold text-dark">Farm Inputs</div>
                <div className="small text-muted">Grow bags &amp; soil mix</div>
              </div>
            </Link>
          </div>
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
          <Link to="/shop" className="btn btn-farm-primary">
            View Full Catalog <i className="fas fa-arrow-right ms-1" />
          </Link>
        </div>
      </section>
    </div>
  );
}
