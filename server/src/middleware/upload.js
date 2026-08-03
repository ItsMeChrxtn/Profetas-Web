import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { fileTypeFromFile } from 'file-type';
import { HttpError } from '../utils/httpError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');

const ALLOWED_MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, matches the original PHP upload cap

function makeUploader(subfolder, filenamePrefix) {
  const destination = path.join(uploadsRoot, subfolder);

  const storage = multer.diskStorage({
    destination,
    filename(req, file, cb) {
      const ext = ALLOWED_MIME_EXT[file.mimetype] || 'bin';
      cb(null, `${filenamePrefix}_${crypto.randomUUID()}.${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter(req, file, cb) {
      if (!ALLOWED_MIME_EXT[file.mimetype]) {
        return cb(new HttpError(400, 'Only JPEG, PNG, or WEBP images are allowed.'));
      }
      cb(null, true);
    },
  });
}

export const uploadProductImage = makeUploader('products', 'product');
export const uploadEducationImage = makeUploader('education', 'edu');
export const uploadReceiptImage = makeUploader('receipts', 'receipt');

/**
 * multer's file.mimetype is client-supplied and spoofable. This re-checks the
 * actual file bytes after upload (the Node equivalent of PHP's
 * mime_content_type() sniff) and deletes+rejects on mismatch. Call after the
 * multer .single(...) middleware in the route chain; no-ops if no file.
 */
export function verifyImageMagicBytes(req, res, next) {
  if (!req.file) return next();

  fileTypeFromFile(req.file.path)
    .then((type) => {
      if (!type || !ALLOWED_MIME_EXT[type.mime]) {
        return fs.unlink(req.file.path).finally(() => {
          res.status(400).json({ success: false, message: 'Uploaded file is not a valid JPEG, PNG, or WEBP image.' });
        });
      }
      next();
    })
    .catch(next);
}

export function uploadedFilePublicPath(subfolder, file) {
  return `/uploads/${subfolder}/${file.filename}`;
}

export async function deleteUploadedFile(publicPath) {
  if (!publicPath) return;
  const relativePath = publicPath.replace(/^\/uploads\//, '');
  try {
    await fs.unlink(path.join(uploadsRoot, relativePath));
  } catch {
    // already gone / never existed - fine to ignore
  }
}
