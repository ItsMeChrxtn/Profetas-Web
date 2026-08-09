import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { cartApi } from '../../api/cart.js';
import { peso } from '../../utils/peso.js';
import { mediaUrl } from '../../utils/mediaUrl.js';

function CartRow({ item, onUpdate, onRemove }) {
  const [qty, setQty] = useState(item.quantity);

  return (
    <div className="d-flex align-items-center gap-3 p-3 border-bottom">
      <img
        src={mediaUrl(item.image) || '/placeholder.svg'}
        alt=""
        style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 10 }}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = '/placeholder.svg';
        }}
      />
      <div className="flex-grow-1">
        <div className="fw-bold">{item.name}</div>
        <div className="small text-muted">
          {peso(item.price)} / {item.unit}
        </div>
      </div>
      <div className="d-flex align-items-center gap-2">
        <input
          type="number"
          value={qty}
          min={1}
          max={item.stockQty}
          className="form-control form-control-sm"
          style={{ width: 70 }}
          onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)}
        />
        <button type="button" className="btn btn-sm btn-farm-outline" onClick={() => onUpdate(item.productId, Math.max(0, qty))}>
          Update
        </button>
      </div>
      <div className="fw-bold text-end" style={{ width: 100, color: 'var(--primary-green)' }}>
        {peso(item.subtotal)}
      </div>
      <button type="button" className="btn btn-sm text-danger" onClick={() => onRemove(item.productId)}>
        <i className="far fa-trash-alt" />
      </button>
    </div>
  );
}

export default function Cart() {
  const { items, asItemsArray, updateQuantity, removeItem } = useCart();
  const [resolved, setResolved] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const requested = asItemsArray();
    if (requested.length === 0) {
      setResolved([]);
      setSubtotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    cartApi.validate(requested).then((data) => {
      setResolved(data.items);
      setSubtotal(data.subtotal);
      setLoading(false);
    });
  }, [items, asItemsArray]);

  if (loading) return null;

  if (resolved.length === 0) {
    return (
      <div className="container" style={{ paddingTop: 30, paddingBottom: 60 }}>
        <h2 className="section-title">Your Cart</h2>
        <div className="farm-card text-center py-5">
          <i className="fas fa-shopping-basket fa-2x mb-3" style={{ color: 'var(--text-muted)' }} />
          <p>Your cart is empty.</p>
          <Link to="/shop" className="btn btn-farm-primary">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 60 }}>
      <h2 className="section-title">Your Cart</h2>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="farm-card p-0">
            {resolved.map((item) => (
              <CartRow key={item.productId} item={item} onUpdate={updateQuantity} onRemove={removeItem} />
            ))}
          </div>
        </div>
        <div className="col-lg-4">
          <div className="farm-card">
            <h5 className="fw-bold mb-3">Order Summary</h5>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Subtotal</span>
              <span className="fw-bold">{peso(subtotal)}</span>
            </div>
            <p className="small text-muted">Delivery fees are calculated at checkout based on your chosen delivery method.</p>
            <button className="btn btn-farm-primary w-100 mt-2" onClick={() => navigate('/checkout')}>
              Proceed to Checkout <i className="fas fa-arrow-right ms-1" />
            </button>
          </div>
          {subtotal >= 10000 && (
            <div className="alert alert-warning mt-3 small">
              <i className="fas fa-info-circle me-1" /> Ordering ₱10,000+? Consider our{' '}
              <Link to="/wholesale">Wholesale Inquiry</Link> for bulk pricing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
