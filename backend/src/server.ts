import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { authRouter } from './routes/authRoutes.js';
import { userAuthRouter } from './routes/userAuthRoutes.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { uploadRouter } from './routes/uploadRoutes.js';
import { analyzeRouter } from './routes/analyzeRoutes.js';
import { searchRouter } from './routes/searchRoutes.js';
import { listingRouter } from './routes/listingRoutes.js';
import { categoryRouter } from './routes/categoryRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createServer() {
  const app = express();

  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5176',
    'http://localhost:3001',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ];
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin) || /\.netlify\.app$/.test(origin)) {
        cb(null, true);
      } else {
        cb(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
  }));
  app.use(express.json());

  // Serve uploaded images
  app.use('/uploads', express.static(join(__dirname, '../uploads')));

  // API routes
  app.use(authMiddleware);
  app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
  app.use('/api/auth', authRouter);
  app.use('/api/users', userAuthRouter);
  app.use('/api/upload', uploadRouter);
  app.use('/api/analyze', analyzeRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/listings', listingRouter);
  app.use('/api/categories', categoryRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
