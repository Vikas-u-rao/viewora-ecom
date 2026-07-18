import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestId } from './middleware/requestId';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import collectionRoutes from './routes/collections';
import cartRoutes from './routes/cart';
import wishlistRoutes from './routes/wishlist';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import adminRoutes from './routes/admin';
import contactRoutes from './routes/contact';
import variantRoutes from './routes/variants';
import couponRoutes from './routes/coupons';
import subscriberRoutes from './routes/subscribers';

// Jobs
import { startStockCleanupJob } from './jobs/stockReservationCleanup';
import { startCouponExpiryJob } from './jobs/couponExpiry';

const app = express();

// Security middleware
app.use(helmet());
// Support comma-separated origins: CLIENT_URL=https://viewora.in,https://staging.viewora.in
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g., server-to-server, curl) and listed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    }
  },
  credentials: true,
}));

// Compress JSON responses (3-5x bandwidth reduction)
app.use(compression());

// Rate limiting — global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests', details: [] } },
}));

app.use(express.json());
app.use(cookieParser());
app.use(requestId);

// Stricter rate limit for auth and payments
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

// Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/collections', collectionRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', authLimiter, paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/variants', variantRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/subscribers', subscriberRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Centralized error handler (must be last)
app.use(errorHandler);

const PORT = Number(process.env.PORT || 5000);

function startServer(port: number, attempts = 0) {
  const server = app.listen(port, () => {
    logger.info({ msg: `VIEWORA server running on port ${port}`, env: process.env.NODE_ENV });
    // Start background jobs
    startStockCleanupJob();
    startCouponExpiryJob();
  });

  server.on('error', (err: any) => {
    if (err?.code === 'EADDRINUSE' && attempts < 5) {
      const nextPort = port + 1;
      logger.warn({ msg: `Port ${port} in use, trying ${nextPort}` });
      setTimeout(() => startServer(nextPort, attempts + 1), 200);
      return;
    }

    logger.error({ msg: 'Failed to start server', error: err });
    // If we can't recover, exit so nodemon can show error and await changes
    process.exit(1);
  });
}

startServer(PORT);

export default app;
