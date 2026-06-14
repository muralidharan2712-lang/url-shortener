const express = require('express');
const router = express.Router();
const {
  createLink,
  getLinks,
  getLinkById,
  updateLink,
  deleteLink,
  toggleFavorite,
  duplicateLink,
  getQRCode,
  checkAlias,
  exportLinks,
} = require('../controllers/linkController');
const { authenticate } = require('../middleware/auth');
const {
  createLinkValidator,
  updateLinkValidator,
  getLinkValidator,
  listLinksValidator,
} = require('../validators/linkValidators');
const { handleValidationErrors } = require('../middleware/validate');
const { createLinkLimiter } = require('../middleware/rateLimiter');

// All link routes require authentication
router.use(authenticate);

// GET /api/links/export - Export all links as CSV (before /:id to avoid conflicts)
router.get('/export', exportLinks);

// GET /api/links/check-alias - Check alias availability
router.get('/check-alias', checkAlias);

// POST /api/links - Create new link
router.post(
  '/',
  createLinkLimiter,
  createLinkValidator,
  handleValidationErrors,
  createLink
);

// GET /api/links - List all links with search/filter/sort/pagination
router.get('/', listLinksValidator, handleValidationErrors, getLinks);

// GET /api/links/:id - Get single link
router.get('/:id', getLinkValidator, handleValidationErrors, getLinkById);

// PUT /api/links/:id - Update link
router.put('/:id', updateLinkValidator, handleValidationErrors, updateLink);

// DELETE /api/links/:id - Delete link
router.delete('/:id', getLinkValidator, handleValidationErrors, deleteLink);

// PATCH /api/links/:id/favorite - Toggle favorite
router.patch('/:id/favorite', getLinkValidator, handleValidationErrors, toggleFavorite);

// POST /api/links/:id/duplicate - Duplicate link
router.post('/:id/duplicate', getLinkValidator, handleValidationErrors, duplicateLink);

// GET /api/links/:id/qr - Get/download QR code
router.get('/:id/qr', getLinkValidator, handleValidationErrors, getQRCode);

module.exports = router;
