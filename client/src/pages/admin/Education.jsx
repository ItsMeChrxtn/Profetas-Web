import { useEffect, useState } from 'react';
import { adminEducationApi } from '../../api/admin/education.js';
import { PageHeader } from '../../components/admin/PageHeader.jsx';
import { Modal } from '../../components/admin/Modal.jsx';
import { formatDate } from '../../utils/dateFormat.js';
import { confirmAction } from '../../utils/confirm.js';
import { showToast } from '../../utils/toast.js';

const CATEGORIES = ['Tutorial', 'Tip', 'Recipe'];

function PostFormModal({ post, onClose, onSaved }) {
  const isEdit = Boolean(post);
  const [form, setForm] = useState({ title: post?.title || '', category: post?.category || 'Tip', content: post?.content || '' });
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
        await adminEducationApi.update(post._id, formData);
      } else {
        await adminEducationApi.create(formData);
      }
      showToast('success', 'Post saved.');
      onSaved();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Education Post' : 'Add Education Post'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn btn-primary" form="postForm" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Post'}
          </button>
        </>
      }
    >
      <form id="postForm" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input type="text" className="form-control" required value={form.title} onChange={(e) => update('title', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Category</label>
          <select className="form-control" value={form.category} onChange={(e) => update('category', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Content</label>
          <textarea className="form-control" rows={6} required value={form.content} onChange={(e) => update('content', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Image {post?.image ? '(leave blank to keep current photo)' : ''}</label>
          <input type="file" className="form-control" accept="image/png, image/jpeg, image/webp" onChange={(e) => setImageFile(e.target.files[0] || null)} />
        </div>
      </form>
    </Modal>
  );
}

export default function Education() {
  const [posts, setPosts] = useState([]);
  const [modal, setModal] = useState(null);

  function reload() {
    adminEducationApi.list().then((data) => setPosts(data.posts));
  }

  useEffect(reload, []);

  async function handleDelete(post) {
    const confirmed = await confirmAction('Delete this post?', { confirmButtonText: 'Yes, delete it' });
    if (!confirmed) return;
    try {
      await adminEducationApi.remove(post._id);
      showToast('success', 'Post deleted.');
      reload();
    } catch (err) {
      showToast('error', err.message);
    }
  }

  return (
    <>
      <PageHeader
        title="Education Posts"
        subtitle="Manage tutorials, tips, and recipes shown on the customer site."
        actions={
          <button className="btn btn-primary" onClick={() => setModal({ mode: 'add' })}>
            <i className="fas fa-plus" /> Add Post
          </button>
        }
      />

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <i className="fas fa-book-open" /> Education Posts
          </h3>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Category</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post._id}>
                  <td>
                    <img
                      src={post.image || '/placeholder.svg'}
                      style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border-color)' }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                      alt=""
                    />
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--primary-green)' }}>{post.title}</td>
                  <td>{post.category}</td>
                  <td>{formatDate(post.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn btn-icon btn-outline" onClick={() => setModal({ mode: 'edit', post })}>
                        <i className="far fa-edit" />
                      </button>
                      <button className="btn btn-icon btn-outline text-danger" onClick={() => handleDelete(post)}>
                        <i className="far fa-trash-alt" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                    No posts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <PostFormModal
          post={modal.mode === 'edit' ? modal.post : null}
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
