import mongoose from 'mongoose';
import { connectDb } from '../src/config/db.js';
import { User } from '../src/models/index.js';
import { hashPassword } from '../src/utils/password.js';

// Creates an admin account, or promotes/resets an existing user with that email.
// Usage: npm run create-admin -- <email> <password> [firstName] [lastName]
const [email, password, firstName = 'Farm', lastName = 'Administrator'] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: npm run create-admin -- <email> <password> [firstName] [lastName]');
  process.exit(1);
}

try {
  await connectDb();
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    {
      $set: { passwordHash: await hashPassword(password), role: 'admin' },
      $setOnInsert: { firstName, lastName },
    },
    { upsert: true, new: true, runValidators: true }
  );
  console.log(`Admin ready: ${user.email} (role: ${user.role})`);
} catch (err) {
  console.error('Failed to create admin:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
