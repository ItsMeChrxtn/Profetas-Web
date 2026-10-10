import validator from 'validator';
import { SiteSettings, User } from '../../models/index.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { HttpError } from '../../utils/httpError.js';
import { deleteUploadedFile, uploadedFilePublicPath } from '../../middleware/upload.js';

export async function getSettings(req, res) {
  const settings = (await SiteSettings.findById('singleton')) || (await SiteSettings.create({ _id: 'singleton' }));
  res.json({ success: true, settings });
}

export async function updateSettings(req, res) {
  const { chatStatus, facebookUrl, shopeeUrl, gcashNumber } = req.body;
  if (chatStatus && !['online', 'offline'].includes(chatStatus)) {
    throw new HttpError(400, 'Chat status must be online or offline.');
  }

  const settings = await SiteSettings.findByIdAndUpdate(
    'singleton',
    {
      ...(chatStatus && { chatStatus }),
      ...(facebookUrl !== undefined && { facebookUrl }),
      ...(shopeeUrl !== undefined && { shopeeUrl }),
      ...(gcashNumber !== undefined && { gcashNumber }),
    },
    { new: true, upsert: true }
  );

  res.json({ success: true, settings });
}

export async function getProfile(req, res) {
  const user = await User.findById(req.user.id).select('firstName lastName email contactNumber');
  if (!user) throw new HttpError(404, 'Account not found.');
  res.json({ success: true, user });
}

export async function updateProfile(req, res) {
  const { firstName, lastName, email, contactNumber } = req.body;
  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    throw new HttpError(400, 'First name, last name, and email are required.');
  }
  if (!validator.isEmail(email)) {
    throw new HttpError(400, 'Please enter a valid email address.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: req.user.id } });
  if (existing) throw new HttpError(400, 'That email is already in use by another account.');

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { firstName: firstName.trim(), lastName: lastName.trim(), email: normalizedEmail, contactNumber: contactNumber?.trim() || undefined },
    { new: true }
  ).select('firstName lastName email contactNumber');

  res.json({ success: true, user });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const user = await User.findById(req.user.id);
  if (!user || !(await verifyPassword(currentPassword || '', user.passwordHash))) {
    throw new HttpError(400, 'Current password is incorrect.');
  }
  if (!newPassword || newPassword.length < 8) {
    throw new HttpError(400, 'New password must be at least 8 characters.');
  }
  if (newPassword !== confirmPassword) {
    throw new HttpError(400, 'New passwords do not match.');
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  res.json({ success: true, message: 'Password updated.' });
}

const MAX_HERO_IMAGES = 6;
const MAX_GLIMPSE_IMAGES = 6;

async function loadSettings() {
  return (await SiteSettings.findById('singleton')) || SiteSettings.create({ _id: 'singleton' });
}

/** Adds a landing page image: slot 'hero' (slideshow), 'glimpse' (farm gallery) or 'about'. */
export async function addLandingImage(req, res, next) {
  const imagePath = req.file ? uploadedFilePublicPath('site', req.file) : null;
  try {
    const { slot, caption } = req.body;
    if (!imagePath) throw new HttpError(400, 'Please choose an image to upload.');

    const settings = await loadSettings();
    if (slot === 'hero') {
      if (settings.heroImages.length >= MAX_HERO_IMAGES) throw new HttpError(400, `You can have up to ${MAX_HERO_IMAGES} hero images.`);
      settings.heroImages.push(imagePath);
    } else if (slot === 'glimpse') {
      if (settings.glimpseImages.length >= MAX_GLIMPSE_IMAGES) throw new HttpError(400, `You can have up to ${MAX_GLIMPSE_IMAGES} farm photos.`);
      settings.glimpseImages.push({ image: imagePath, caption: caption?.trim() || '' });
    } else if (slot === 'about') {
      const old = settings.aboutImage;
      settings.aboutImage = imagePath;
      if (old) await deleteUploadedFile(old);
    } else {
      throw new HttpError(400, 'Unknown image slot.');
    }

    await settings.save();
    res.json({ success: true, settings });
  } catch (err) {
    if (imagePath) await deleteUploadedFile(imagePath);
    next(err);
  }
}

export async function removeLandingImage(req, res) {
  const { slot, image } = req.body;
  const settings = await loadSettings();

  if (slot === 'hero') settings.heroImages = settings.heroImages.filter((p) => p !== image);
  else if (slot === 'glimpse') settings.glimpseImages = settings.glimpseImages.filter((g) => g.image !== image);
  else if (slot === 'about' && settings.aboutImage === image) settings.aboutImage = null;
  else throw new HttpError(400, 'Unknown image slot.');

  await settings.save();
  await deleteUploadedFile(image);
  res.json({ success: true, settings });
}

/** Text parts of the landing page: About text and the farm photo captions. */
export async function updateLandingContent(req, res) {
  const { aboutText, glimpseCaptions } = req.body;
  const settings = await loadSettings();
  if (aboutText !== undefined) settings.aboutText = String(aboutText).trim();
  if (Array.isArray(glimpseCaptions)) {
    settings.glimpseImages.forEach((g, i) => {
      if (glimpseCaptions[i] !== undefined) g.caption = String(glimpseCaptions[i]).trim();
    });
  }
  await settings.save();
  res.json({ success: true, settings });
}
