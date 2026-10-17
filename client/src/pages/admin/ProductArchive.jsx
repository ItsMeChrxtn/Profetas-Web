import { useEffect, useState } from 'react';
import { adminProductsApi } from '../../api/admin/products.js';
import { PageHeader } from '../../components/admin/PageHeader.jsx';
import { Modal } from '../../components/admin/Modal.jsx';
import { peso } from '../../utils/peso.js';
import { formatDate } from '../../utils/dateFormat.js';
import { mediaUrl } from '../../utils/mediaUrl.js';
import { confirmAction } from '../../utils/confirm.js';
import { showToast } from '../../utils/toast.js';

const CATEGORIES = ['Fresh', 'Value-Added', 'Farm Inputs'];

/** Restoring asks the admin to re-check price and stock, which may be stale after archiving. */
function RestoreModal({ product, onClose, onRestored }) {
  const [form, setForm] = useState({ price: product.price, stockQty: product.stockQty, status: 'Active' });
  const [saving, setSaving] = useState(false);
  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function handleRestore(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminProductsApi.restore(product._id, form);
      showToast('success', res.message);
      onRestored();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Restore "${product.name}"`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" form="restoreForm" type="submit" disabled={saving}>
            <i className="fas fa-undo" /> {saving ? 'Restoring...' : 'Restore Product'}
          </button>
        </>
      }
    >
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 0 }}>
        Check that this product is still valid and that its price and stock are correct before it goes back on sale.
      </p>
      <form id="restoreForm" onSubmit={handleRestore}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
          <div className="form-group">
            <label>Price (₱)</label>
            <input type="number" step="0.01" min="0.01" className="form-control" required value={form.price} onChange={update('price')} />
          </div>
          <div className="form-group">
            <label>Stock Quantity</label>
            <input type="number" min="0" className="form-control" required value={form.stockQty} onChange={update('stockQty')} />
          </div>
        </div>
        <div className="form-group">
          <label>Restore as</label>
          <select className="form-control" value={form.status} onChange={update('status')}>
            <option value="Active">Active - visible in the shop</option>
            <option value="Inactive">Inactive - hidden until you activate it</option>
          </select>
        </div>
      </form>
    </Modal>
  );
}

export default function ProductArchive() {
  const [filters, setFilters] = useState({ q: '', category: '', from: '', to: '' });
  const [applied, setApplied] = useState(filters);
  const [items, setItems] = useState(null);
  const [restoring, setRestoring] = useState(null);

  function load() {
    const params = Object.fromEntries(Object.entries(applied).filter(([, v]) => v));
    adminProductsApi.archived(params).then((data) => setItems(data.items));
  }
  useEffect(load, [applied]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (field) => (e) => setFilters((prev) => ({ ...prev, [field]: e.target.value }));

  async function handleDelete(product) {
    if (product.hasOrders) {
      showToast('error', 'This product appears in past orders, so it stays archived to keep those records intact.');
      return;
    }
    const ok = await confirmAction(`Permanently delete "${product.name}"? This cannot be undone.`, { confirmButtonText: 'Yes, delete permanently' });
    if (!ok) return;
    try {
      const res = await adminProductsApi.deletePermanently(product._id);
      showToast('success', res.message);
      load();
    } catch (err) {
      showToast('error', err.message);
    }
  }

  return (
    <>
      <PageHeader title="Product Archive" subtitle="Archived products are hidden from the shop and can't be ordered. Past orders keep their details." />

      <div className="card">
        <form
          className="card-header"
          style={{ flexWrap: 'wrap', gap: 10 }}
          onSubmit={(e) => {
            e.preventDefault();
            setApplied(filters);
          }}
        >
          <div className="header-search" style={{ width: 260 }}>
            <i className="fas fa-search" />
            <input type="text" className="form-control" placeholder="Search by name..." value={filters.q} onChange={update('q')} />
          </div>
          <select className="form-control" style={{ width: 170 }} value={filters.category} onChange={update('category')}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <div className="report-dates">
            <span>Archived</span>
            <input type="date" className="form-control" value={filters.from} onChange={update('from')} />
            <span>to</span>
            <input type="date" className="form-control" value={filters.to} onChange={update('to')} />
          </div>
          <button type="submit" className="btn btn-primary">
            <i className="fas fa-search" /> Search
          </button>
        </form>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Archived On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(items || []).map((p) => (
                <tr key={p._id}>
                  <td>
                    <img
                      src={mediaUrl(p.image) || '/placeholder.svg'}
                      alt=""
                      style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-color)' }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {p.name}
                    {p.hasOrders && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>In past orders</div>}
                  </td>
                  <td>{p.category}</td>
                  <td>{peso(p.price)}</td>
                  <td>{p.stockQty}</td>
                  <td>{formatDate(p.archivedAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn btn-outline" style={{ padding: '6px 10px' }} title="Restore" onClick={() => setRestoring(p)}>
                        <i className="fas fa-undo" /> Restore
                      </button>
                      <button
                        className="btn btn-icon btn-outline text-danger"
                        title={p.hasOrders ? 'Kept for order history' : 'Delete permanently'}
                        disabled={p.hasOrders}
                        onClick={() => handleDelete(p)}
                      >
                        <i className="far fa-trash-alt" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items && items.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                    No archived products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {restoring && (
        <RestoreModal
          product={restoring}
          onClose={() => setRestoring(null)}
          onRestored={() => {
            setRestoring(null);
            load();
          }}
        />
      )}
    </>
  );
}
