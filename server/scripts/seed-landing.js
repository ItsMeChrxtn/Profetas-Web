import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { fileTypeFromBuffer } from 'file-type';
import { connectDb } from '../src/config/db.js';
import { SiteSettings, UploadedFile } from '../src/models/index.js';

// One-time: fills the landing page (hero slideshow, Glimpse of the Farm, About)
// with the farm's photos in seed/site-images/ and the About text. Only fills
// sections that are still empty, so it never overwrites what an admin set.
// Usage: npm run seed-landing
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, '..', 'seed', 'site-images');

const ABOUT_TEXT = `Profeta Integrated Farm is a climate-resilient, sustainable agricultural establishment located in Tres Cruces, Tanza, Cavite, Philippines. The farm's history centers on its transformation from a private multi-commodity farm into a prominent hub for organic agriculture education and technical vocational training. The farm was established and is owned by Mario Profeta, a visionary farmer-leader who initially focused on building a resilient, multi-commodity ecosystem. The farm practices diversified agriculture, combining livestock raising (chickens, ducks, and rabbits) with the production of organic crops like mangoes, mushrooms, bok choy, and bananas. From its early years, the farm prioritized modern, climate-resilient systems, utilizing advanced agricultural tools such as a Solar Pump Irrigation System and natural organic inputs like mokusaku (wood vinegar).`;

const GLIMPSE_CAPTIONS = {
  'glimpse-1-mushroom-house.webp': 'Our mushroom growing house',
  'glimpse-2-mokusaku.webp': 'Preparing natural farm inputs',
  'glimpse-3-seedlings.webp': 'Seedling preparation',
};

async function storeImage(filename) {
  const data = await fs.readFile(path.join(imagesDir, filename));
  const type = await fileTypeFromBuffer(data);
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[type?.mime];
  if (!ext) throw new Error(`${filename} is not a JPEG/PNG/WEBP image`);
  const publicPath = `/uploads/site/site_${crypto.randomUUID()}.${ext}`;
  await UploadedFile.create({ path: publicPath, contentType: type.mime, size: data.length, data });
  return publicPath;
}

await connectDb();
const settings = (await SiteSettings.findById('singleton')) || new SiteSettings({ _id: 'singleton' });
const files = (await fs.readdir(imagesDir)).sort();

if (settings.heroImages.length === 0) {
  for (const f of files.filter((f) => f.startsWith('hero-'))) settings.heroImages.push(await storeImage(f));
  console.log(`hero: ${settings.heroImages.length} images`);
}
if (settings.glimpseImages.length === 0) {
  for (const f of files.filter((f) => f.startsWith('glimpse-'))) {
    settings.glimpseImages.push({ image: await storeImage(f), caption: GLIMPSE_CAPTIONS[f] || '' });
  }
  console.log(`glimpse: ${settings.glimpseImages.length} images`);
}
if (!settings.aboutImage) {
  settings.aboutImage = await storeImage('hero-1-mario-training.jpg');
  console.log('about: image set');
}
if (!settings.aboutText) {
  settings.aboutText = ABOUT_TEXT;
  console.log('about: text set');
}

await settings.save();
console.log('Landing page content ready.');
await mongoose.disconnect();
