import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { productsApi } from '../../api/products.js';
import { ProductCard } from '../../components/site/ProductCard.jsx';

const CATEGORIES = ['Fresh', 'Value-Added', 'Farm Inputs'];

function shopUrl(category, q, page) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (q) params.set('q', q);
  if (page > 1) params.set('page', page);
  const qs = params.toString();
  return `/shop${qs ? `?${qs}` : ''}`;
}

export default function Shop() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const initialQ = searchParams.get('q') || '';
  const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);

  const [searchInput, setSearchInput] = useState(initialQ);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1 });

  useEffect(() => {
    setSearchInput(initialQ);
  }, [initialQ]);

  useEffect(() => {
    productsApi.list({ category, q: initialQ, page }).then((data) => {
      setItems(data.items);
      setPagination(data.pagination);
    });
  }, [category, initialQ, page]);

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 60 }}>
      <h2 className="section-title">Shop Our Products</h2>
      <p className="section-subtitle">Fresh produce, value-added goods, and farm inputs &mdash; all from our cooperative.</p>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div className="d-flex flex-wrap gap-2">
          <Link to={shopUrl('', initialQ, 1)} className={`category-pill ${category === '' ? 'active' : ''}`}>
            All
          </Link>
          {CATEGORIES.map((cat) => (
            <Link key={cat} to={shopUrl(cat, initialQ, 1)} className={`category-pill ${category === cat ? 'active' : ''}`}>
              {cat}
            </Link>
          ))}
        </div>
        <form
          className="d-flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(shopUrl(category, searchInput.trim(), 1));
          }}
        >
          <input
            type="text"
            className="form-control"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ minWidth: 220 }}
          />
          <button type="submit" className="btn btn-farm-outline">
            <i className="fas fa-search" />
          </button>
        </form>
      </div>

      {items.length === 0 ? (
        <div className="farm-card text-center py-5">
          <i className="fas fa-seedling fa-2x mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="mb-0">No products found. Try a different search or category.</p>
        </div>
      ) : (
        <>
          <div className="row g-4">
            {items.map((p) => (
              <div className="col-6 col-md-4 col-lg-3" key={p._id}>
                <ProductCard product={p} harvestedLabel="Today" />
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <nav className="mt-4">
              <ul className="pagination justify-content-center">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((i) => (
                  <li className={`page-item ${i === page ? 'active' : ''}`} key={i}>
                    <Link className="page-link" to={shopUrl(category, initialQ, i)}>
                      {i}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
