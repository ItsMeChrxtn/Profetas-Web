import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { HttpError } from '../utils/httpError.js';
import { UploadedFile } from '../models/UploadedFile.js';
import { env } from '../config/env.js';
import { verifyToken } from '../utils/jwt.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Only used for files uploaded before images moved into Mongo (local dev copies).
const legacyUploadsRoot = path.join(__dirname, '..', '..', 'uploads');

const ALLOWED_MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, matches the original PHP upload cap

// Wholesaler documents (valid IDs, permits) are only served to admins.
const PRIVATE_SUBFOLDERS = ['wholesale'];

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

  const tagFiles = (req) => {
    for (const file of allFiles(req)) file.uploadTarget = { subfolder, filenamePrefix };
  };
  const wrap = (handler) => (req, res, next) =>
    handler(req, res, (err) => {
      if (!err) tagFiles(req);
      next(err);
    });

  return {
    single: (fieldName) => wrap(upload.single(fieldName)),
    fields: (spec) => wrap(upload.fields(spec)),
  };
}

export const uploadProductImage = makeUploader('products', 'product');
export const uploadEducationImage = makeUploader('education', 'edu');
export const uploadReceiptImage = makeUploader('receipts', 'receipt');
export const uploadSiteImage = makeUploader('site', 'site');
export const uploadWholesaleDocs = makeUploader('wholesale', 'doc');

/** req.file and every entry of req.files (from .fields()), as one list. */
function allFiles(req) {
  const files = req.file ? [req.file] : [];
  if (req.files) files.push(...Object.values(req.files).flat());
  return files;
}

/**
 * multer's file.mimetype is client-supplied and spoofable. This re-checks the
 * actual file bytes (the Node equivalent of PHP's mime_content_type() sniff),
 * rejects on mismatch, and otherwise stores each image in Mongo and sets
 * file.filename. Call after the uploader's .single()/.fields() middleware in
 * the route chain; no-ops if no file.
 */
export async function verifyImageMagicBytes(req, res, next) {
  const files = allFiles(req);
  try {
    const types = await Promise.all(files.map((file) => fileTypeFromBuffer(file.buffer)));
    if (types.some((type) => !type || !ALLOWED_MIME_EXT[type.mime])) {
      return res.status(400).json({ success: false, message: 'Uploaded file is not a valid JPEG, PNG, or WEBP image.' });
    }

    for (const [i, file] of files.entries()) {
      const { subfolder, filenamePrefix } = file.uploadTarget;
      file.filename = `${filenamePrefix}_${crypto.randomUUID()}.${ALLOWED_MIME_EXT[types[i].mime]}`;
      await UploadedFile.create({
        path: uploadedFilePublicPath(subfolder, file),
        contentType: types[i].mime,
        size: file.size,
        data: file.buffer,
      });
      file.buffer = null;
    }
    next();
  } catch (err) {
    next(err);
  }
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

function isAdminRequest(req) {
  const token = req.cookies?.[env.cookieName];
  if (!token) return false;
  try {
    return verifyToken(token).role === 'admin';
  } catch {
    return false;
  }
}

/** Express handler for GET /uploads/* - streams the image from Mongo. */
export async function serveUploadedFile(req, res, next) {
  try {
    const subfolder = req.path.split('/')[2];
    const isPrivate = PRIVATE_SUBFOLDERS.includes(subfolder);
    if (isPrivate && !isAdminRequest(req)) {
      return res.status(403).json({ success: false, message: 'Not allowed.' });
    }

    const file = await UploadedFile.findOne({ path: req.path });
    if (!file) return next();
    res.set({
      'Content-Type': file.contentType,
      // Filenames are unique UUIDs, so public images can be cached forever.
      'Cache-Control': isPrivate ? 'private, no-store' : 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    });
    res.send(file.data);
  } catch (err) {
    next(err);
  }
}
