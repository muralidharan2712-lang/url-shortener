const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getTopLinks,
  getRecentActivity,
  getFavoriteLinks,
  getHealthOverview,
} = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(authenticate);

// GET /api/dashboard/summary
router.get('/summary', getDashboardSummary);

// GET /api/dashboard/top-links
router.get('/top-links', getTopLinks);

// GET /api/dashboard/recent-activity
router.get('/recent-activity', getRecentActivity);

// GET /api/dashboard/favorites
router.get('/favorites', getFavoriteLinks);

// GET /api/dashboard/health
router.get('/health', getHealthOverview);

module.exports = router;
