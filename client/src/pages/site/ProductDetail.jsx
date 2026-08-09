import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { productsApi } from '../../api/products.js';
import { useCart } from '../../context/CartContext.jsx';
import { peso } from '../../utils/peso.js';
import { stockStatus, StockBadge } from '../../components/site/StockBadge.jsx';
import { QuantityStepper } from '../../components/site/QuantityStepper.jsx';
import { ProductCard } from '../../components/site/ProductCard.jsx';
import { showToast } from '../../utils/toast.js';
import { mediaUrl } from '../../utils/mediaUrl.js';

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setNotFound(false);
    setProduct(null);
    setQty(1);
    productsApi
      .get(id)
      .then((data) => {
        setProduct(data.product);
        setRelated(data.related);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="container py-5 text-center">
        <h3>Product not found.</h3>
        <Link to="/shop" className="btn btn-farm-primary mt-3">
          Back to Shop
        </Link>
      </div>
    );
  }

  if (!product) return null;

  const status = stockStatus(product.stockQty, product.lowStockThreshold);
  const inStock = status !== 'Out of Stock';

  async function handleAddToCart() {
    setAdding(true);
    try {
      await addItem(product._id, qty);
      showToast('success', `Added ${qty} × ${product.name} to cart.`);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 60 }}>
      <nav aria-label="breadcrumb" className="small mb-3">
        <Link to="/shop">Shop</Link> / <Link to={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link> /{' '}
        {product.name}
      </nav>

      <div className="row g-5">
        <div className="col-md-6">
          <div className="product-img-wrap" style={{ height: 380, borderRadius: 'var(--radius-md)', position: 'relative' }}>
            {product.isHarvestedToday && (
              <span className="harvested-badge">
                <i className="fas fa-seedling" /> Harvested Today
              </span>
            )}
            <img
              src={mediaUrl(product.image) || '/placeholder.svg'}
              alt={product.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="product-cat mb-1">{product.category}</div>
          <h1 className="mb-2" style={{ fontWeight: 800, color: 'var(--text-main)' }}>
            {product.name}
          </h1>
          <div className="mb-3">
            <span className="fs-3 fw-800" style={{ color: 'var(--primary-green)', fontWeight: 800 }}>
              {peso(product.price)}
            </span>
            <span className="text-muted">/ {product.unit}</span>
          </div>
          <div className="mb-3 d-inline-block">
            <StockBadge stockQty={product.stockQty} lowStockThreshold={product.lowStockThreshold} />
            {inStock && <span className="ms-1">({product.stockQty} available)</span>}
          </div>

          <p className="text-muted mt-3" style={{ whiteSpace: 'pre-line' }}>
            {product.description}
          </p>

          {inStock ? (
            <div className="d-flex align-items-center gap-3 mt-4">
              <QuantityStepper value={qty} max={product.stockQty} onChange={setQty} />
              <button className="btn btn-farm-primary flex-grow-1" disabled={adding} onClick={handleAddToCart}>
                <i className="fas fa-shopping-basket me-2" />
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          ) : (
            <button className="btn btn-farm-outline mt-4" disabled>
              <i className="fas fa-ban me-2" />Out of Stock
            </button>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-5">
          <h2 className="section-title">More from {product.category}</h2>
          <div className="row g-4">
            {related.map((r) => (
              <div className="col-6 col-md-3" key={r._id}>
                <div className="product-card">
                  <Link to={`/product/${r._id}`} className="text-decoration-none text-reset">
                    <div className="product-img-wrap">
                      <img
                        src={mediaUrl(r.image) || '/placeholder.svg'}
                        alt={r.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="product-body">
                      <div className="product-name">{r.name}</div>
                      <span className="product-price">{peso(r.price)}</span> <span className="product-unit">/ {r.unit}</span>
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
