import validator from 'validator';
import { User, ADMIN_ROLES } from '../../models/index.js';
import { HttpError } from '../../utils/httpError.js';
import { hashPassword } from '../../utils/password.js';

const MIN_PASSWORD_LENGTH = 8;

/** Super admin: every staff account (admins and super admins). */
export async function listAdminUsers(req, res) {
  const users = await User.find({ role: { $in: ADMIN_ROLES } })
    .select('firstName lastName email role lastLoginAt createdAt')
    .sort({ role: -1, createdAt: 1 });
  res.json({ success: true, users });
}

export async function createAdminUser(req, res) {
  const { firstName, lastName, email, password, role } = req.body;
  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) throw new HttpError(400, 'Name and email are required.');
  if (!validator.isEmail(email.trim())) throw new HttpError(400, 'Please enter a valid email address.');
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (!ADMIN_ROLES.includes(role)) throw new HttpError(400, 'Please choose a valid role.');

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) throw new HttpError(400, 'An account with that email already exists.');

  const user = await User.create({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    role,
  });
  res.status(201).json({ success: true, user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role } });
}

/** Change a staff member's role, or remove their admin access (role -> customer). */
export async function updateAdminRole(req, res) {
  const { role } = req.body;
  if (![...ADMIN_ROLES, 'customer'].includes(role)) throw new HttpError(400, 'Please choose a valid role.');
  if (req.params.id === req.user.id) throw new HttpError(400, "You can't change your own role.");

  const user = await User.findOne({ _id: req.params.id, role: { $in: ADMIN_ROLES } });
  if (!user) throw new HttpError(404, 'Staff account not found.');

  // Never leave the system without a super admin.
  if (user.role === 'superadmin' && role !== 'superadmin' && (await User.countDocuments({ role: 'superadmin' })) <= 1) {
    throw new HttpError(400, 'There must always be at least one super admin.');
  }

  user.role = role;
  await user.save();
  res.json({ success: true, message: role === 'customer' ? 'Admin access removed.' : 'Role updated.' });
}
