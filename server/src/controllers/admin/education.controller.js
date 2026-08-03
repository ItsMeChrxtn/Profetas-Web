import { EducationPost, EDUCATION_CATEGORY_VALUES } from '../../models/index.js';
import { deleteUploadedFile, uploadedFilePublicPath } from '../../middleware/upload.js';
import { HttpError } from '../../utils/httpError.js';

export async function listAdminPosts(req, res) {
  const posts = await EducationPost.find({}).sort({ createdAt: -1 });
  res.json({ success: true, posts });
}

export async function createPost(req, res, next) {
  try {
    const { title, content, category } = req.body;
    if (!title?.trim() || !content?.trim()) {
      throw new HttpError(400, 'Title and content are required.');
    }

    const post = await EducationPost.create({
      title: title.trim(),
      category: EDUCATION_CATEGORY_VALUES.includes(category) ? category : 'Tip',
      content: content.trim(),
      image: req.file ? uploadedFilePublicPath('education', req.file) : null,
    });

    res.status(201).json({ success: true, post });
  } catch (err) {
    if (req.file) await deleteUploadedFile(uploadedFilePublicPath('education', req.file));
    next(err);
  }
}

export async function updatePost(req, res, next) {
  try {
    const existing = await EducationPost.findById(req.params.id);
    if (!existing) throw new HttpError(404, 'Post not found.');

    const { title, content, category } = req.body;
    if (!title?.trim() || !content?.trim()) {
      throw new HttpError(400, 'Title and content are required.');
    }

    existing.title = title.trim();
    existing.category = EDUCATION_CATEGORY_VALUES.includes(category) ? category : 'Tip';
    existing.content = content.trim();

    if (req.file) {
      const oldImage = existing.image;
      existing.image = uploadedFilePublicPath('education', req.file);
      if (oldImage) await deleteUploadedFile(oldImage);
    }

    await existing.save();
    res.json({ success: true, post: existing });
  } catch (err) {
    if (req.file) await deleteUploadedFile(uploadedFilePublicPath('education', req.file));
    next(err);
  }
}

export async function deletePost(req, res) {
  const post = await EducationPost.findByIdAndDelete(req.params.id);
  if (!post) throw new HttpError(404, 'Post not found.');
  if (post.image) await deleteUploadedFile(post.image);
  res.json({ success: true });
}
