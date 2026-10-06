import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { HttpError } from '../utils/httpError.js';
import { UploadedFile } from '../models/UploadedFile.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Only used for files uploaded before images moved into Mongo (local dev copies).
const legacyUploadsRoot = path.join(__dirname, '..', '..', 'uploads');

const ALLOWED_MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, matches the original PHP upload cap

// Files are held in memory, then verifyImageMagicBytes saves them to Mongo -
// Render's local disk does not survive a redeploy.
function makeUploader(subfolder, filenamePrefix) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter(req, file, cb) {
      if (!ALLOWED_MIME_EXT[file.mimetype]) {
        return cb(new HttpError(400, 'Only JPEG, PNG, or WEBP images are allowed.'));
      }
      cb(null, true);
    },
  });

  return {
    single(fieldName) {
      const handler = upload.single(fieldName);
      return (req, res, next) =>
        handler(req, res, (err) => {
          if (!err && req.file) req.file.uploadTarget = { subfolder, filenamePrefix };
          next(err);
        });
    },
  };
}

export const uploadProductImage = makeUploader('products', 'product');
export const uploadEducationImage = makeUploader('education', 'edu');
export const uploadReceiptImage = makeUploader('receipts', 'receipt');

/**
 * multer's file.mimetype is client-supplied and spoofable. This re-checks the
 * actual file bytes (the Node equivalent of PHP's mime_content_type() sniff),
 * rejects on mismatch, and otherwise stores the image in Mongo and sets
 * req.file.filename. Call after the uploader's .single(...) middleware in the
 * route chain; no-ops if no file.
 */
export function verifyImageMagicBytes(req, res, next) {
  if (!req.file) return next();

  fileTypeFromBuffer(req.file.buffer)
    .then(async (type) => {
      const ext = type && ALLOWED_MIME_EXT[type.mime];
      if (!ext) {
        return res.status(400).json({ success: false, message: 'Uploaded file is not a valid JPEG, PNG, or WEBP image.' });
      }
      const { subfolder, filenamePrefix } = req.file.uploadTarget;
      req.file.filename = `${filenamePrefix}_${crypto.randomUUID()}.${ext}`;
      await UploadedFile.create({
        path: uploadedFilePublicPath(subfolder, req.file),
        contentType: type.mime,
        size: req.file.size,
        data: req.file.buffer,
      });
      req.file.buffer = null;
      next();
    })
    .catch(next);
}

export function uploadedFilePublicPath(subfolder, file) {
  return `/uploads/${subfolder}/${file.filename}`;
}

export async function deleteUploadedFile(publicPath) {
  if (!publicPath) return;
  await UploadedFile.deleteOne({ path: publicPath });
  const relativePath = publicPath.replace(/^\/uploads\//, '');
  try {
    await fs.unlink(path.join(legacyUploadsRoot, relativePath));
  } catch {
    // already gone / never existed - fine to ignore
  }
}

/** Express handler for GET /uploads/* - streams the image from Mongo. */
export async function serveUploadedFile(req, res, next) {
  try {
    const file = await UploadedFile.findOne({ path: req.path });
    if (!file) return next();
    res.set({
      'Content-Type': file.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable', // filenames are unique UUIDs
      'X-Content-Type-Options': 'nosniff',
    });
    res.send(file.data);
  } catch (err) {
    next(err);
  }
}
