import mongoose from 'mongoose';

/**
 * Uploaded images (product/education photos, GCash receipts) stored in Mongo
 * instead of on local disk. Render's disk is wiped on every redeploy/restart,
 * which made uploaded images 404. `path` is the public URL the image is served
 * at (e.g. /uploads/products/product_<uuid>.jpg), so stored image paths on
 * products/orders didn't have to change.
 */
const uploadedFileSchema = new mongoose.Schema(
  {
    path: { type: String, required: true, unique: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export const UploadedFile = mongoose.model('UploadedFile', uploadedFileSchema);
