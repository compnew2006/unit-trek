import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { initializeDatabase, closeDatabase } from './config/database.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Routes - Note: Routes are still in .js format, will be migrated gradually
// eslint-disable-next-line @typescript-eslint/no-require-imports
import authRoutes from './routes/auth.js';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import usersRoutes from './routes/users.js';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import warehousesRoutes from './routes/warehouses.js';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import itemsRoutes from './routes/items.js';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import movementsRoutes from './routes/movements.js';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import historyRoutes from './routes/history.js';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import monitoringRoutes from './routes/monitoring.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS must come before other middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400, // 24 hours
}));

// Enhanced security headers with CSP
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline scripts for development
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));

app.use(morgan('combined'));
app.use(cookieParser()); // Parse cookies for httpOnly token support
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Limit URL-encoded payload size

// Health check (bypass rate limiting)
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply general API rate limiting to all routes
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/warehouses', warehousesRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/movements', movementsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api', monitoringRoutes); // Error logging, performance, feedback

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const errorMessage = err.message || 'Internal server error';
  const statusCode = (err as { status?: number }).status || 500;
  
  console.error('Error:', err);
  
  res.status(statusCode).json({
    error: errorMessage,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Initialize database and start server
const startServer = async (): Promise<void> => {
  try {
    await initializeDatabase();
    const port = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
    app.listen(port, 'localhost', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Database: ${process.env.DB_TYPE || 'postgresql'}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:8080'}`);
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to start server:', errorMessage);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await closeDatabase();
  process.exit(0);
});

