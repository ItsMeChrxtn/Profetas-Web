import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import { env, isProduction } from './config/env.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.routes.js';
import { productsRouter } from './routes/products.routes.js';
import { cartRouter } from './routes/cart.routes.js';
import { ordersRouter } from './routes/orders.routes.js';
import { adminProductsRouter } from './routes/admin/products.routes.js';
import { wholesaleRouter } from './routes/wholesale.routes.js';
import { farmVisitsRouter } from './routes/farmVisits.routes.js';
import { educationRouter } from './routes/education.routes.js';
import { loyaltyRouter } from './routes/loyalty.routes.js';
import { settingsRouter } from './routes/settings.routes.js';
import { adminOrdersRouter } from './routes/admin/orders.routes.js';
import { adminPaymentsRouter } from './routes/admin/payments.routes.js';
import { adminCustomersRouter } from './routes/admin/customers.routes.js';
import { adminDashboardRouter } from './routes/admin/dashboard.routes.js';
import { adminInventoryRouter } from './routes/admin/inventory.routes.js';
import { adminReportsRouter } from './routes/admin/reports.routes.js';
import { adminSettingsRouter } from './routes/admin/settings.routes.js';
import { adminEducationRouter } from './routes/admin/education.routes.js';
import { adminFarmVisitsRouter } from './routes/admin/farmVisits.routes.js';
import { adminWholesaleRouter } from './routes/admin/wholesale.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(isProduction ? 'combined' : 'dev'));

app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'), {
    setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff'),
  })
);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Profetas Farm API is running.' });
});

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/wholesale-inquiries', wholesaleRouter);
app.use('/api/farm-visits', farmVisitsRouter);
app.use('/api/education-posts', educationRouter);
app.use('/api/loyalty', loyaltyRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/admin/orders', adminOrdersRouter);
app.use('/api/admin/payments', adminPaymentsRouter);
app.use('/api/admin/customers', adminCustomersRouter);
app.use('/api/admin/dashboard', adminDashboardRouter);
app.use('/api/admin/inventory', adminInventoryRouter);
app.use('/api/admin/reports', adminReportsRouter);
app.use('/api/admin/settings', adminSettingsRouter);
app.use('/api/admin/education-posts', adminEducationRouter);
app.use('/api/admin/farm-visits', adminFarmVisitsRouter);
app.use('/api/admin/wholesale-inquiries', adminWholesaleRouter);

if (isProduction) {
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);
