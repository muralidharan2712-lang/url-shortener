const express = require('express');
const router = express.Router();
const { signup, login, getMe, updateProfile, forgotPassword, resetPassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { signupValidator, loginValidator } = require('../validators/authValidators');
const { handleValidationErrors } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/signup
router.post(
  '/signup',
  authLimiter,
  signupValidator,
  handleValidationErrors,
  signup
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  loginValidator,
  handleValidationErrors,
  login
);

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, forgotPassword);

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', authLimiter, resetPassword);

// GET /api/auth/me  (protected)
router.get('/me', authenticate, getMe);

// PATCH /api/auth/profile  (protected)
router.patch('/profile', authenticate, updateProfile);

module.exports = router;
