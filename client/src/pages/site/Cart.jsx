import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { cartApi } from '../../api/cart.js';
import { peso } from '../../utils/peso.js';
import { mediaUrl } from '../../utils/mediaUrl.js';

function CartRow({ item, selected, onToggle, onUpdate, onRemove }) {
  const [qty, setQty] = useState(item.quantity);

  return (
    <div className="d-flex align-items-center gap-3 p-3 border-bottom">
      <input
        type="checkbox"
        className="form-check-input cart-check mt-0"
        checked={selected}
        onChange={() => onToggle(item.productId)}
        aria-label={`Select ${item.name} for checkout`}
      />
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
  // Lines ticked for checkout; new lines start ticked.
  const [deselected, setDeselected] = useState(() => new Set());
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

  const selectedItems = resolved.filter((item) => !deselected.has(String(item.productId)));
  const selectedSubtotal = Math.round(selectedItems.reduce((sum, item) => sum + item.subtotal, 0) * 100) / 100;
  const allSelected = selectedItems.length === resolved.length;

  function toggle(productId) {
    setDeselected((prev) => {
      const next = new Set(prev);
      const key = String(productId);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    setDeselected(allSelected ? new Set(resolved.map((item) => String(item.productId))) : new Set());
  }

  function checkout() {
    navigate('/checkout', {
      state: { fromCart: true, items: selectedItems.map((item) => ({ productId: item.productId, quantity: item.quantity })) },
    });
  }

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
            <label className="d-flex align-items-center gap-3 px-3 py-2 border-bottom small fw-bold mb-0" style={{ cursor: 'pointer' }}>
              <input type="checkbox" className="form-check-input cart-check mt-0" checked={allSelected} onChange={toggleAll} />
              Select all ({resolved.length})
            </label>
            {resolved.map((item) => (
              <CartRow
                key={item.productId}
                item={item}
                selected={!deselected.has(String(item.productId))}
                onToggle={toggle}
                onUpdate={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>
        </div>
        <div className="col-lg-4">
          <div className="farm-card">
            <h5 className="fw-bold mb-3">Order Summary</h5>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">
                Subtotal ({selectedItems.length} of {resolved.length} items)
              </span>
              <span className="fw-bold">{peso(selectedSubtotal)}</span>
            </div>
            <p className="small text-muted">Delivery fees are calculated at checkout based on your chosen delivery method.</p>
            <button className="btn btn-farm-primary w-100 mt-2" onClick={checkout} disabled={selectedItems.length === 0}>
              Checkout Selected <i className="fas fa-arrow-right ms-1" />
            </button>
          </div>
          {subtotal >= 10000 && (
            <div className="alert alert-warning mt-3 small">
              <i className="fas fa-info-circle me-1" /> Ordering ₱10,000+? <Link to="/wholesale">Become our wholesaler</Link> for
              bulk pricing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
