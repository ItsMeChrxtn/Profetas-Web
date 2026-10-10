import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../../api/products.js';
import { ProductCard } from '../../components/site/ProductCard.jsx';
import { useSiteSettings } from '../../context/SiteSettingsContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { mediaUrl } from '../../utils/mediaUrl.js';

const HERO_SLIDE_MS = 6000;

const CATEGORIES = [
  { to: '/shop?category=Fresh', title: 'Fresh Produce', subtitle: 'Mushrooms & mangoes', icon: 'fa-leaf', iconBg: 'var(--success-bg)', iconColor: 'var(--success-text)' },
  { to: '/shop?category=Value-Added', title: 'Value-Added', subtitle: 'Mokusaku, jams & more', icon: 'fa-flask', iconBg: 'var(--warning-bg)', iconColor: 'var(--warning-text)' },
  { to: '/shop?category=Farm+Inputs', title: 'Farm Inputs', subtitle: 'Grow bags & soil mix', icon: 'fa-seedling', iconBg: '#DBEAFE', iconColor: '#1E40AF' },
];

/** Hero background: the admin's images (Settings > Landing Page), cross-fading. */
function HeroSlideshow({ images }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % images.length), HERO_SLIDE_MS);
    return () => clearInterval(timer);
  }, [images.length]);

  if (images.length === 0) return null;
  return (
    <>
      <div className="hero-slides" aria-hidden="true">
        {images.map((src, i) => (
          <div key={src} className={`hero-slide ${i === index ? 'active' : ''}`} style={{ backgroundImage: `url(${mediaUrl(src)})` }} />
        ))}
      </div>
      {images.length > 1 && (
        <div className="hero-dots">
          {images.map((src, i) => (
            <button key={src} type="button" className={i === index ? 'active' : ''} aria-label={`Show image ${i + 1}`} onClick={() => setIndex(i)} />
          ))}
        </div>
      )}
    </>
  );
}

function ProductRow({ title, subtitle, icon, items }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-5">
      <h2 className="section-title">
        <i className={`fas ${icon} me-2`} />
        {title}
      </h2>
      <p className="section-subtitle">{subtitle}</p>
      <div className="row g-4">
        {items.map((p) => (
          <div className="col-6 col-md-4 col-lg-3" key={p._id}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const settings = useSiteSettings();
  const { user } = useAuth();
  const [harvestedToday, setHarvestedToday] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    productsApi.harvestedToday().then((data) => setHarvestedToday(data.items));
    productsApi.featured().then((data) => setFeatured(data.items));
    productsApi.bestSellers().then((data) => setBestSellers(data.items));
    productsApi.popular().then((data) => setPopular(data.items));
  }, []);

  const heroImages = settings.heroImages || [];
  const glimpse = settings.glimpseImages || [];

  return (
    <div className="container">
      <section className={`hero-section ${heroImages.length ? 'has-images' : ''}`}>
        <HeroSlideshow images={heroImages} />
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
              Become Our Wholesaler
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
              <Link to={c.to} className="farm-card d-flex align-items-center gap-3 text-decoration-none">
                <div className="category-icon" style={{ background: c.iconBg, color: c.iconColor }}>
                  <i className={`fas ${c.icon}`} />
                </div>
                <div>
                  <div className="fw-bold text-dark">{c.title}</div>
                  <div className="small text-muted">{c.subtitle}</div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <ProductRow title="Best Sellers" subtitle="Our most-ordered products of all time." icon="fa-trophy" items={bestSellers} />
      <ProductRow title="Popular This Month" subtitle="What customers have been ordering lately." icon="fa-fire" items={popular} />

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

      {glimpse.length > 0 && (
        <section className="mt-5">
          <h2 className="section-title">
            <i className="fas fa-camera me-2" />A Glimpse of the Farm
          </h2>
          <p className="section-subtitle">Life at Profeta Integrated Farm in Tres Cruces, Tanza, Cavite.</p>
          <div className="row g-3">
            {glimpse.map((g) => (
              <div className="col-md-4" key={g.image}>
                <figure className="glimpse-card">
                  <img src={mediaUrl(g.image)} alt={g.caption || 'Profeta Integrated Farm'} loading="lazy" />
                  {g.caption && <figcaption>{g.caption}</figcaption>}
                </figure>
              </div>
            ))}
          </div>
        </section>
      )}

      {settings.aboutText && (
        <section className="mt-5 mb-5">
          <div className="farm-card about-card">
            <div className="row g-4 align-items-center">
              {settings.aboutImage && (
                <div className="col-lg-5">
                  <img src={mediaUrl(settings.aboutImage)} alt="Profeta Integrated Farm" className="about-image" loading="lazy" />
                </div>
              )}
              <div className={settings.aboutImage ? 'col-lg-7' : 'col-12'}>
                <div className="about-eyebrow">About the Company</div>
                <h2 className="section-title mb-3">Profeta Integrated Farm</h2>
                <p className="about-text">{settings.aboutText}</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
