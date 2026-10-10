import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminProductsApi } from '../../api/admin/products.js';
import { PageHeader } from '../../components/admin/PageHeader.jsx';
import { Modal } from '../../components/admin/Modal.jsx';
import { peso } from '../../utils/peso.js';
import { confirmAction } from '../../utils/confirm.js';
import { showToast } from '../../utils/toast.js';
import { mediaUrl } from '../../utils/mediaUrl.js';

const CATEGORIES = ['Fresh', 'Value-Added', 'Farm Inputs'];

function stockStatusLabel(qty, threshold) {
  if (qty <= 0) return 'Out of Stock';
  if (qty <= threshold) return 'Low Stock';
  return 'In Stock';
}

function ProductFormModal({ product, onClose, onSaved }) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState({
    name: product?.name || '',
    category: product?.category || '',
    price: product?.price ?? '',
    unit: product?.unit || 'kg',
    stockQty: product?.stockQty ?? 0,
    description: product?.description || '',
    status: product?.status || 'Active',
    isHarvestedToday: product?.isHarvestedToday || false,
    weightKg: product?.weightKg ?? 0.5,
    availableForWholesale: product?.availableForWholesale || false,
    wholesalePrice: product?.wholesalePrice ?? '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (imageFile) formData.append('image', imageFile);

      if (isEdit) {
        await adminProductsApi.update(product._id, formData);
      } else {
        await adminProductsApi.create(formData);
      }
      showToast('success', 'Product saved.');
      onSaved();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Product' : 'Add New Product'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn btn-primary" form="productForm" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </>
      }
    >
      <form id="productForm" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Product Name</label>
          <input type="text" className="form-control" required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Enter product name" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 15 }}>
          <div className="form-group">
            <label>Category</label>
            <select className="form-control" required value={form.category} onChange={(e) => update('category', e.target.value)}>
              <option value="">Select Category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Price (₱)</label>
            <input type="number" step="0.01" className="form-control" required value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="0.00" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 15 }}>
          <div className="form-group">
            <label>Unit</label>
            <input type="text" className="form-control" value={form.unit} onChange={(e) => update('unit', e.target.value)} placeholder="kg, pack, bottle..." />
          </div>
          <div className="form-group">
            <label>Stock Quantity</label>
            <input type="number" className="form-control" required value={form.stockQty} onChange={(e) => update('stockQty', e.target.value)} placeholder="0" />
          </div>
        </div>
        <div className="form-group">
          <label>Weight per unit (kg)</label>
          <input type="number" step="0.01" min="0" className="form-control" required value={form.weightKg} onChange={(e) => update('weightKg', e.target.value)} />
          <small style={{ color: 'var(--text-muted)' }}>Used to pick the Lalamove vehicle and compute the delivery fee.</small>
        </div>
        <div className="form-group" style={{ background: '#F9FAFB', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="availableForWholesale"
              checked={form.availableForWholesale}
              onChange={(e) => update('availableForWholesale', e.target.checked)}
            />
            <label htmlFor="availableForWholesale" style={{ margin: 0 }}>
              Show on the wholesaler page
            </label>
          </div>
          {form.availableForWholesale && (
            <div style={{ marginTop: 10 }}>
              <label>Wholesale Price (₱)</label>
              <input type="number" step="0.01" min="0" className="form-control" required value={form.wholesalePrice} onChange={(e) => update('wholesalePrice', e.target.value)} placeholder="0.00" />
            </div>
          )}
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea className="form-control" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 15 }}>
          <div className="form-group">
            <label>Status</label>
            <select className="form-control" value={form.status} onChange={(e) => update('status', e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 28 }}>
            <input type="checkbox" id="harvestedToday" checked={form.isHarvestedToday} onChange={(e) => update('isHarvestedToday', e.target.checked)} />
            <label htmlFor="harvestedToday" style={{ margin: 0 }}>
              Harvested Today
            </label>
          </div>
        </div>
        <div className="form-group">
          <label>Product Image {product?.image ? '(leave blank to keep current photo)' : ''}</label>
          <input type="file" className="form-control" accept="image/png, image/jpeg, image/webp" onChange={(e) => setImageFile(e.target.files[0] || null)} />
        </div>
      </form>
    </Modal>
  );
}

const PRODUCT_STATUSES = ['Active', 'Inactive'];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page'), 10) || 1;

  const [searchInput, setSearchInput] = useState(q);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [modal, setModal] = useState(null);

  function reload() {
    adminProductsApi.list({ q, category, status, page }).then((data) => {
      setItems(data.items);
      setPagination(data.pagination);
    });
  }

  useEffect(reload, [q, category, status, page]);

  async function handleDelete(product) {
    const confirmed = await confirmAction('Delete this product? This cannot be undone.', { confirmButtonText: 'Yes, delete it' });
    if (!confirmed) return;
    try {
      await adminProductsApi.remove(product._id);
      showToast('success', 'Product deleted.');
      reload();
    } catch (err) {
      showToast('error', err.message);
    }
  }

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Manage your farm products, pricing, and categories."
        actions={
          <button className="btn btn-primary" onClick={() => setModal({ mode: 'add' })}>
            <i className="fas fa-plus" /> Add Product
          </button>
        }
      />

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 15 }}>
          <form
            className="header-search"
            style={{ width: 350 }}
            onSubmit={(e) => {
              e.preventDefault();
              setSearchParams({ q: searchInput.trim(), category, status });
            }}
          >
            <i className="fas fa-search" />
            <input type="text" placeholder="Search products..." className="form-control" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </form>

          <div className="status-filter-row">
            <button
              type="button"
              className={`status-filter-pill ${category === '' ? 'active' : ''}`}
              onClick={() => setSearchParams({ q, category: '', status })}
            >
              All Categories
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`status-filter-pill ${category === c ? 'active' : ''}`}
                onClick={() => setSearchParams({ q, category: c, status })}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="status-filter-row">
            <button
              type="button"
              className={`status-filter-pill ${status === '' ? 'active' : ''}`}
              onClick={() => setSearchParams({ q, category, status: '' })}
            >
              All Status
            </button>
            {PRODUCT_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className={`status-filter-pill ${status === s ? 'active' : ''}`}
                onClick={() => setSearchParams({ q, category, status: s })}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((product) => {
                const stockStatus = stockStatusLabel(product.stockQty, product.lowStockThreshold);
                const stockClass = stockStatus.replace(/\s/g, '').toLowerCase();
                return (
                  <tr key={product._id}>
                    <td>
                      <img
                        src={mediaUrl(product.image) || '/placeholder.svg'}
                        style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border-color)' }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                        alt=""
                      />
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary-green)' }}>
                      {product.name}
                      {product.availableForWholesale && (
                        <span className="wholesaler-tag" title={`Wholesale ${peso(product.wholesalePrice)}`}>
                          <i className="fas fa-handshake" /> Wholesale
                        </span>
                      )}
                    </td>
                    <td>{product.category}</td>
                    <td style={{ fontWeight: 700 }}>
                      {peso(product.price)} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 11 }}>/ {product.unit}</span>
                    </td>
                    <td>
                      <span className={`status-pill status-${stockClass}`}>
                        {product.stockQty} - {stockStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill status-${product.status.toLowerCase()}`}>{product.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-icon btn-outline" onClick={() => setModal({ mode: 'edit', product })}>
                          <i className="far fa-edit" />
                        </button>
                        <button className="btn btn-icon btn-outline text-danger" onClick={() => handleDelete(product)}>
                          <i className="far fa-trash-alt" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card-footer" style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Showing {items.length} of {pagination.total} products
          </span>
          <div className="pagination" style={{ display: 'flex', gap: 5 }}>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((i) => (
              <button
                key={i}
                className={`btn btn-icon ${i === page ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSearchParams({ q, category, status, page: i })}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <ProductFormModal
          product={modal.mode === 'edit' ? modal.product : null}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            reload();
          }}
        />
      )}
    </>
  );
}
