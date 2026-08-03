import { EducationPost, EDUCATION_CATEGORY_VALUES } from '../models/index.js';
import { HttpError } from '../utils/httpError.js';

export async function listPosts(req, res) {
  const { category } = req.query;
  const filter = {};
  if (category && EDUCATION_CATEGORY_VALUES.includes(category)) filter.category = category;

  const posts = await EducationPost.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, posts });
}

export async function getPost(req, res) {
  const post = await EducationPost.findById(req.params.id);
  if (!post) throw new HttpError(404, 'Post not found.');
  res.json({ success: true, post });
}
