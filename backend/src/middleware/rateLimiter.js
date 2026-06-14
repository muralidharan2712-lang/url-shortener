const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded: ${req.ip} - ${req.path}`);
    res.status(429).json(options.message);
  },
});

/**
 * Strict auth rate limiter for login/signup
 * 10 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  handler: (req, res, next, options) => {
    logger.warn(`Auth rate limit exceeded: ${req.ip} - ${req.path}`);
    res.status(429).json(options.message);
  },
});

/**
 * Link creation rate limiter
 * 30 link creations per hour
 */
const createLinkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Link creation limit reached. Maximum 30 links per hour.',
  },
});

/**
 * Redirect rate limiter (per short code)
 * 200 redirects per minute (to prevent redirect abuse)
 */
const redirectLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many redirect requests.',
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  createLinkLimiter,
  redirectLimiter,
};
