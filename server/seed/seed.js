/**
 * One-time seed script - recreates the same sample data schema.sql shipped
 * with the PHP app (2 accounts, 8 products+stock, 3 education posts, site
 * settings) as Mongo documents. Not a live MySQL->Mongo migration; there is
 * no real production data yet. Safe to re-run - wipes all collections first.
 *
 * Usage: npm run seed --prefix server
 *
 * Note: schema.sql's seeded product/education `image` paths (e.g.
 * assets/img/products/oyster-mushroom.jpg) were never backed by actual
 * uploaded files in the original PHP project - only a shared placeholder.svg
 * exists. So seeded documents here use image: null, and the client falls
 * back to /placeholder.svg, matching the original site's actual rendered
 * behavior (broken image -> onerror -> placeholder).
 */
import { connectDb } from '../src/config/db.js';
import {
  User,
  Product,
  Order,
  WholesaleInquiry,
  FarmVisit,
  EducationPost,
  LoyaltyVoucher,
  SiteSettings,
  Counter,
} from '../src/models/index.js';
import { hashPassword } from '../src/utils/password.js';

const PRODUCTS = [
  { name: 'Fresh Oyster Mushroom', category: 'Fresh', description: 'Locally grown oyster mushrooms, harvested fresh from our grow houses.', price: 120.0, unit: 'kg', isHarvestedToday: true, stockQty: 45, lowStockThreshold: 10 },
  { name: 'Fresh Shiitake Mushroom', category: 'Fresh', description: 'Premium shiitake mushrooms grown on native hardwood logs.', price: 220.0, unit: 'kg', isHarvestedToday: true, stockQty: 8, lowStockThreshold: 10 },
  { name: 'Carabao Mango', category: 'Fresh', description: 'Sweet, ripe carabao mangoes from our own orchard.', price: 150.0, unit: 'kg', isHarvestedToday: false, stockQty: 60, lowStockThreshold: 15 },
  { name: 'Mokusaku (Wood Vinegar)', category: 'Value-Added', description: 'Pyroligneous acid distilled from farm biomass, used as an organic soil conditioner and pest deterrent.', price: 180.0, unit: '500ml bottle', isHarvestedToday: false, stockQty: 30, lowStockThreshold: 5 },
  { name: 'Dried Mushroom Chips', category: 'Value-Added', description: 'Crispy, oven-dried mushroom chips - a healthy farm snack.', price: 95.0, unit: 'pack', isHarvestedToday: false, stockQty: 25, lowStockThreshold: 5 },
  { name: 'Mango Jam', category: 'Value-Added', description: 'House-made mango jam from surplus farm mangoes.', price: 130.0, unit: 'jar', isHarvestedToday: false, stockQty: 18, lowStockThreshold: 5 },
  { name: 'Mushroom Grow Bag Kit', category: 'Farm Inputs', description: 'Ready-to-fruit mushroom substrate bag for home growing.', price: 85.0, unit: 'bag', isHarvestedToday: false, stockQty: 0, lowStockThreshold: 5 },
  { name: 'Organic Biochar Soil Mix', category: 'Farm Inputs', description: 'Biochar-enriched soil amendment produced on-farm.', price: 60.0, unit: 'kg', isHarvestedToday: false, stockQty: 50, lowStockThreshold: 10 },
];

const EDUCATION_POSTS = [
  { title: 'How We Grow Our Oyster Mushrooms', category: 'Tutorial', content: 'A look into our low-waste substrate process, from spawning to harvest, using rice straw and sawdust sourced within Tanza.' },
  { title: '3 Ways to Cook Fresh Shiitake', category: 'Recipe', content: 'Simple recipes to bring out the umami of fresh shiitake: garlic butter saute, mushroom sinigang, and grilled skewers.' },
  { title: 'Using Mokusaku in Your Home Garden', category: 'Tip', content: 'Dilution ratios and application tips for using our wood vinegar as a natural pest deterrent and soil conditioner.' },
];

async function seed() {
  await connectDb();

  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    WholesaleInquiry.deleteMany({}),
    FarmVisit.deleteMany({}),
    EducationPost.deleteMany({}),
    LoyaltyVoucher.deleteMany({}),
    SiteSettings.deleteMany({}),
    Counter.deleteMany({}),
  ]);

  const users = await User.insertMany([
    {
      firstName: 'Farm',
      lastName: 'Administrator',
      email: 'admin@profetasfarm.com',
      passwordHash: await hashPassword('Admin@123'),
      role: 'admin',
    },
    {
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      email: 'customer@example.com',
      passwordHash: await hashPassword('Customer@123'),
      contactNumber: '0917-000-0000',
      role: 'customer',
    },
  ]);

  const products = await Product.insertMany(
    PRODUCTS.map((p) => ({ ...p, image: null, status: 'Active' }))
  );

  const educationPosts = await EducationPost.insertMany(
    EDUCATION_POSTS.map((p) => ({ ...p, image: null }))
  );

  await SiteSettings.create({
    _id: 'singleton',
    chatStatus: 'offline',
    facebookUrl: 'https://facebook.com/profetasfarm',
    shopeeUrl: 'https://shopee.ph/profetasfarm',
    gcashNumber: '0917-123-4567 (Profetas Integrated Farm)',
  });

  await Counter.create({ _id: 'orderNumber', seq: 0 });

  console.log('Seed complete:');
  console.log(`  users:           ${users.length}`);
  console.log(`  products:        ${products.length}`);
  console.log(`  education posts: ${educationPosts.length}`);
  console.log('  site settings:   1');
  console.log('  order counter:   reset to 0');
  console.log('\nSample logins:');
  console.log('  Admin:    admin@profetasfarm.com    / Admin@123');
  console.log('  Customer: customer@example.com      / Customer@123');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
