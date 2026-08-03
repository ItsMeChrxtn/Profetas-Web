import { Link } from 'react-router-dom';
import { peso } from '../../utils/peso.js';
import { StockBadge } from './StockBadge.jsx';

export function ProductCard({ product, harvestedLabel = 'Harvested Today' }) {
  return (
    <div className="product-card">
      {product.isHarvestedToday && (
        <span className="harvested-badge">
          <i className="fas fa-seedling" /> {harvestedLabel}
        </span>
      )}
      <Link to={`/product/${product._id}`} className="text-decoration-none text-reset">
        <div className="product-img-wrap">
          <img
            src={product.image || '/placeholder.svg'}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>
        <div className="product-body">
          <div className="product-cat">{product.category}</div>
          <div className="product-name">{product.name}</div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="product-price">{peso(product.price)}</span>
            <span className="product-unit">/ {product.unit}</span>
          </div>
          <StockBadge stockQty={product.stockQty} lowStockThreshold={product.lowStockThreshold} />
        </div>
      </Link>
    </div>
  );
}
