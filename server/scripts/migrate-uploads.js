import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { fileTypeFromBuffer } from 'file-type';
import { connectDb } from '../src/config/db.js';
import { UploadedFile } from '../src/models/index.js';

// One-time: copies images still sitting in server/uploads/ into Mongo so they
// are served from the database. Skips files already imported; safe to re-run.
// Usage: npm run migrate-uploads
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.join(__dirname, '..', 'uploads');

await connectDb();
let imported = 0;
let skipped = 0;

for (const subfolder of await fs.readdir(uploadsRoot)) {
  const dir = path.join(uploadsRoot, subfolder);
  if (!(await fs.stat(dir)).isDirectory()) continue;

  for (const filename of await fs.readdir(dir)) {
    const publicPath = `/uploads/${subfolder}/${filename}`;
    const data = await fs.readFile(path.join(dir, filename));
    const type = await fileTypeFromBuffer(data);
    if (!type?.mime.startsWith('image/') || (await UploadedFile.exists({ path: publicPath }))) {
      skipped += 1;
      continue;
    }
    await UploadedFile.create({ path: publicPath, contentType: type.mime, size: data.length, data });
    console.log(`imported ${publicPath}`);
    imported += 1;
  }
}

console.log(`Done: ${imported} imported, ${skipped} skipped.`);
await mongoose.disconnect();
