const express = require('express');
const router = express.Router();
const { getLinkAnalytics, exportAnalytics } = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');
const { param } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validate');

// All analytics routes require authentication
router.use(authenticate);

const validateLinkId = [
  param('id').isMongoId().withMessage('Invalid link ID'),
  handleValidationErrors,
];

// GET /api/analytics/:id - Get detailed analytics for a link
router.get('/:id', validateLinkId, getLinkAnalytics);

// GET /api/analytics/:id/export - Export analytics as CSV
router.get('/:id/export', validateLinkId, exportAnalytics);

module.exports = router;
