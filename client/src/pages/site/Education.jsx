import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { educationApi } from '../../api/education.js';

const CATEGORIES = ['Tutorial', 'Tip', 'Recipe'];

function excerpt(content) {
  const plain = content.replace(/\s+/g, ' ').trim();
  return plain.length > 90 ? `${plain.slice(0, 90)}...` : plain;
}

export default function Education() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    educationApi.list(category ? { category } : {}).then((data) => setPosts(data.posts));
  }, [category]);

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 60 }}>
      <h2 className="section-title">Learn With Profetas Farm</h2>
      <p className="section-subtitle">Tutorials, tips, and recipes from our farm to your kitchen and garden.</p>

      <div className="d-flex flex-wrap gap-2 mb-4">
        <Link to="/education" className={`category-pill ${category === '' ? 'active' : ''}`}>
          All
        </Link>
        {CATEGORIES.map((cat) => (
          <Link key={cat} to={`/education?category=${encodeURIComponent(cat)}`} className={`category-pill ${category === cat ? 'active' : ''}`}>
            {cat}s
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="farm-card text-center py-5">
          <i className="fas fa-book-open fa-2x mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="mb-0">No posts yet. Check back soon!</p>
        </div>
      ) : (
        <div className="row g-4">
          {posts.map((post) => (
            <div className="col-md-4" key={post._id}>
              <div className="product-card h-100">
                <Link to={`/education/${post._id}`} className="text-decoration-none text-reset">
                  <div className="product-img-wrap">
                    <img
                      src={post.image || '/placeholder.svg'}
                      alt={post.title}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <div className="product-body">
                    <div className="product-cat">{post.category}</div>
                    <div className="product-name">{post.title}</div>
                    <p className="small text-muted mb-0">{excerpt(post.content)}</p>
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
