import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { educationApi } from '../../api/education.js';
import { formatDate } from '../../utils/dateFormat.js';
import { mediaUrl } from '../../utils/mediaUrl.js';

export default function EducationPost() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setPost(null);
    setNotFound(false);
    educationApi
      .get(id)
      .then((data) => setPost(data.post))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="container py-5 text-center">
        <h3>Post not found.</h3>
        <Link to="/education" className="btn btn-farm-primary mt-3">
          Back to Learn
        </Link>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="container" style={{ maxWidth: 780, paddingTop: 30, paddingBottom: 60 }}>
      <nav className="small mb-3">
        <Link to="/education">Learn</Link> / {post.category}
      </nav>

      <div className="product-cat mb-2">{post.category}</div>
      <h1 className="mb-2" style={{ fontWeight: 800 }}>
        {post.title}
      </h1>
      <p className="text-muted small mb-4">{formatDate(post.createdAt, { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      {post.image && (
        <img
          src={mediaUrl(post.image)}
          alt=""
          className="w-100 mb-4"
          style={{ borderRadius: 'var(--radius-md)', maxHeight: 400, objectFit: 'cover' }}
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}

      <div style={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>{post.content}</div>

      <Link to="/education" className="btn btn-farm-outline mt-4">
        <i className="fas fa-arrow-left me-2" />Back to Learn
      </Link>
    </div>
  );
}
