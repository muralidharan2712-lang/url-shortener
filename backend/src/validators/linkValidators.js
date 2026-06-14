const { body, param, query } = require('express-validator');

const createLinkValidator = [
  body('originalUrl')
    .trim()
    .notEmpty()
    .withMessage('Original URL is required')
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Please provide a valid HTTP or HTTPS URL')
    .isLength({ max: 2048 })
    .withMessage('URL cannot exceed 2048 characters'),

  body('alias')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .toLowerCase()
    .isLength({ min: 3, max: 50 })
    .withMessage('Alias must be between 3 and 50 characters')
    .matches(/^[a-z0-9-_]+$/)
    .withMessage('Alias can only contain lowercase letters, numbers, hyphens and underscores'),

  body('title')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),

  body('expiryOption')
    .optional()
    .isIn(['never', '1d', '7d', '30d'])
    .withMessage('Expiry option must be one of: never, 1d, 7d, 30d'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Each tag cannot exceed 30 characters'),
];

const updateLinkValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid link ID'),

  body('originalUrl')
    .optional()
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Please provide a valid HTTP or HTTPS URL')
    .isLength({ max: 2048 })
    .withMessage('URL cannot exceed 2048 characters'),

  body('alias')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .toLowerCase()
    .isLength({ min: 3, max: 50 })
    .withMessage('Alias must be between 3 and 50 characters')
    .matches(/^[a-z0-9-_]+$/)
    .withMessage('Alias can only contain lowercase letters, numbers, hyphens and underscores'),

  body('title')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),

  body('expiryOption')
    .optional()
    .isIn(['never', '1d', '7d', '30d'])
    .withMessage('Expiry option must be one of: never, 1d, 7d, 30d'),

  body('status')
    .optional()
    .isIn(['active', 'disabled'])
    .withMessage('Status must be active or disabled'),
];

const getLinkValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid link ID'),
];

const listLinksValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search query too long'),

  query('status')
    .optional()
    .isIn(['active', 'expired', 'disabled', 'all'])
    .withMessage('Status filter must be one of: active, expired, disabled, all'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'clickCount', 'lastVisitedAt', 'originalUrl'])
    .withMessage('Sort field must be one of: createdAt, clickCount, lastVisitedAt, originalUrl'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  query('favorites')
    .optional()
    .isBoolean()
    .withMessage('Favorites filter must be a boolean')
    .toBoolean(),
];

module.exports = {
  createLinkValidator,
  updateLinkValidator,
  getLinkValidator,
  listLinksValidator,
};
