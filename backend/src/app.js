require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');

const authRoutes = require('./routes/authRoutes');
const linkRoutes = require('./routes/linkRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { handleRedirect } = require('./controllers/redirectController');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { generalLimiter, redirectLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disabled for API server
}));

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173', // Vite dev server
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    logger.warn(`CORS blocked origin: ${origin}`);
    callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Sanitization ────────────────────────────────────────────────────────────
// Prevents MongoDB operator injection attacks
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn(`Mongo sanitize - removed suspicious key: ${key} from ${req.path}`);
  },
}));

// ─── General Rate Limiting ───────────────────────────────────────────────────
app.use('/api/', generalLimiter);

// ─── Request Logging ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    logger[level](
      `${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });
  next();
});

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'LinkPulse API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);

// ─── Short URL Redirect ──────────────────────────────────────────────────────
// This MUST be after all API routes to avoid conflicts
// Short codes cannot start with 'api', 'health', 'static'
const RESERVED_PATHS = ['api', 'health', 'static', 'favicon.ico', 'robots.txt'];
app.get('/:shortCode', (req, res, next) => {
  if (RESERVED_PATHS.includes(req.params.shortCode)) {
    return next();
  }
  // Apply redirect-specific rate limit
  redirectLimiter(req, res, () => handleRedirect(req, res));
});

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
