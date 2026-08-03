import mongoose from 'mongoose';

const EDUCATION_CATEGORIES = ['Tutorial', 'Tip', 'Recipe'];

const educationPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    category: { type: String, required: true, enum: EDUCATION_CATEGORIES },
    // Plain text (rendered with line-break formatting client-side), not HTML/markdown -
    // matches the original PHP nl2br(htmlspecialchars($content)) rendering.
    content: { type: String, required: true },
    image: { type: String, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export const EDUCATION_CATEGORY_VALUES = EDUCATION_CATEGORIES;
export const EducationPost = mongoose.model('EducationPost', educationPostSchema);
