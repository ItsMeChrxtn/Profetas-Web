import { useEffect, useState } from 'react';
import { adminInventoryApi } from '../../api/admin/inventory.js';
import { adminProductsApi } from '../../api/admin/products.js';
import { PageHeader } from '../../components/admin/PageHeader.jsx';
import { formatDate } from '../../utils/dateFormat.js';
import { showToast } from '../../utils/toast.js';

function stockStatusLabel(qty, threshold) {
  if (qty <= 0) return 'Out of Stock';
  if (qty <= threshold) return 'Low Stock';
  return 'In Stock';
}
const DOT_COLOR = { instock: '#166534', lowstock: '#F59E0B', outofstock: '#EF4444' };
const STOCK_STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'in', label: 'In Stock' },
  { value: 'low', label: 'Low Stock' },
  { value: 'out', label: 'Out of Stock' },
];

export default function Inventory() {
  const [q, setQ] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState(0);

  function reload() {
    adminInventoryApi.list({ q, stockStatus, page }).then((data) => {
      setItems(data.items);
      setPagination(data.pagination);
    });
  }

  useEffect(reload, [q, stockStatus, page]);

  async function saveStock(productId) {
    try {
      await adminProductsApi.adjustStock(productId, { stockQty: editValue });
      showToast('success', 'Stock updated.');
      setEditingId(null);
      reload();
    } catch (err) {
      showToast('error', err.message);
    }
  }

  const lowStockCount = items.filter((i) => stockStatusLabel(i.stockQty, i.lowStockThreshold) !== 'In Stock').length;

  return (
    <>
      <PageHeader title="Inventory" subtitle="Manage and track all inventory items and stock levels." />

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat-card" style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 80, height: 80, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#166534' }}>
            <i className="fas fa-boxes" />
          </div>
          <div>
            <span className="stat-label">Total Products</span>
            <span className="stat-value">{pagination.total}</span>
          </div>
        </div>
        <div className="stat-card" style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 80, height: 80, background: '#FEF3C7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#92400E' }}>
            <i className="fas fa-exclamation-triangle" />
          </div>
          <div>
            <span className="stat-label">Low / Out of Stock (this page)</span>
            <span className="stat-value">{lowStockCount}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 15 }}>
          <h3 className="card-title">
            <i className="fas fa-clipboard-list" /> Inventory List
          </h3>
          <div className="status-filter-row">
            {STOCK_STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`status-filter-pill ${stockStatus === f.value ? 'active' : ''}`}
                onClick={() => { setStockStatus(f.value); setPage(1); }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="header-search" style={{ width: 300 }}>
            <i className="fas fa-search" />
            <input type="text" placeholder="Search inventory..." className="form-control" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Stock Level</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const status = stockStatusLabel(item.stockQty, item.lowStockThreshold);
                const statusClass = status.replace(/\s/g, '').toLowerCase();
                const isEditing = editingId === item._id;
                return (
                  <tr key={item._id}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={item.image || '/placeholder.svg'}
                        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                        alt=""
                      />
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                    </td>
                    <td>{item.category}</td>
                    <td style={{ fontWeight: 700 }}>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-control"
                          style={{ width: 90 }}
                          value={editValue}
                          onChange={(e) => setEditValue(parseInt(e.target.value, 10) || 0)}
                          autoFocus
                        />
                      ) : (
                        item.stockQty
                      )}
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: DOT_COLOR[statusClass] }} />
                        {status}
                      </span>
                    </td>
                    <td>{formatDate(item.updatedAt)}</td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button className="btn btn-icon btn-primary" onClick={() => saveStock(item._id)}>
                            <i className="fas fa-check" />
                          </button>
                          <button className="btn btn-icon btn-outline" onClick={() => setEditingId(null)}>
                            <i className="fas fa-times" />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-icon btn-outline"
                          onClick={() => {
                            setEditingId(item._id);
                            setEditValue(item.stockQty);
                          }}
                        >
                          <i className="fas fa-pen" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                    No inventory items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card-footer" style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Showing {items.length} of {pagination.total} entries
          </span>
          <div className="pagination" style={{ display: 'flex', gap: 5 }}>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((i) => (
              <button key={i} className={`btn btn-icon ${i === page ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPage(i)}>
                {i}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
