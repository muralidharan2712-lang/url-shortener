const Link = require('../models/Link');
const Visit = require('../models/Visit');
const {
  generateShortCode,
  calculateExpiryDate,
  isLinkExpired,
  computeHealthScore,
  getHealthBadge,
  buildShortUrl,
} = require('../utils/helpers');
const { generateQRCode } = require('../utils/qrcode');
const logger = require('../utils/logger');

/**
 * Enrich a link with computed fields: shortUrl, healthScore, healthBadge, isExpired
 */
const enrichLink = async (link) => {
  const recentVisits = await Visit.find({ linkId: link._id })
    .sort({ visitedAt: -1 })
    .limit(50)
    .lean();

  const healthScore = computeHealthScore(link, recentVisits);
  const healthBadge = getHealthBadge(healthScore);
  const shortUrl = buildShortUrl(link.alias || link.shortCode);

  return {
    ...link.toObject(),
    shortUrl,
    healthScore,
    healthBadge,
    isExpired: isLinkExpired(link.expiryDate),
  };
};

/**
 * POST /api/links
 * Create a new shortened link
 */
const createLink = async (req, res) => {
  try {
    const { originalUrl, alias, title, expiryOption = 'never', tags = [] } = req.body;
    const userId = req.userId;

    // Check alias availability if provided
    if (alias) {
      const aliasExists = await Link.findOne({ $or: [{ alias }, { shortCode: alias }] });
      if (aliasExists) {
        return res.status(409).json({
          success: false,
          message: 'This alias is already taken. Please choose a different one.',
        });
      }
    }

    // Generate unique short code with collision check
    let shortCode;
    let attempts = 0;
    do {
      shortCode = generateShortCode(7);
      attempts++;
      if (attempts > 10) {
        throw new Error('Failed to generate unique short code after 10 attempts');
      }
    } while (await Link.findOne({ shortCode }));

    // Calculate expiry date
    const expiryDate = calculateExpiryDate(expiryOption);

    // Generate QR code
    const shortUrl = buildShortUrl(alias || shortCode);
    const qrCode = await generateQRCode(shortUrl);

    // Create link document
    const link = new Link({
      userId,
      originalUrl,
      shortCode,
      alias: alias || null,
      title: title || null,
      expiryOption,
      expiryDate,
      qrCode,
      tags,
    });

    await link.save();

    logger.info(`Link created: ${shortCode} -> ${originalUrl} by user ${userId}`);

    const enriched = await enrichLink(link);

    res.status(201).json({
      success: true,
      message: 'Link created successfully.',
      data: { link: enriched },
    });
  } catch (error) {
    logger.error(`CreateLink error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to create link. Please try again.',
    });
  }
};

/**
 * GET /api/links
 * List all links for authenticated user with search, filter, sort, pagination
 */
const getLinks = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      favorites,
    } = req.query;

    // Build filter query
    const filter = { userId };

    if (status !== 'all') {
      if (status === 'expired') {
        filter.$or = [
          { status: 'expired' },
          { expiryDate: { $lt: new Date() } },
        ];
      } else {
        filter.status = status;
        // Exclude actually-expired links from 'active' filter
        if (status === 'active') {
          filter.$or = [
            { expiryDate: null },
            { expiryDate: { $gt: new Date() } },
          ];
        }
      }
    }

    if (favorites === true || favorites === 'true') {
      filter.isFavorite = true;
    }

    if (search) {
      filter.$or = [
        { originalUrl: { $regex: search, $options: 'i' } },
        { shortCode: { $regex: search, $options: 'i' } },
        { alias: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    // Sort config
    const sortConfig = {};
    const allowedSortFields = ['createdAt', 'clickCount', 'lastVisitedAt', 'originalUrl'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sortConfig[sortField] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Execute queries in parallel
    const [links, total] = await Promise.all([
      Link.find(filter).sort(sortConfig).skip(skip).limit(limitNum).lean(),
      Link.countDocuments(filter),
    ]);

    // Enrich each link with health scores (batch)
    const linkIds = links.map((l) => l._id);
    const recentVisitsMap = {};

    if (linkIds.length > 0) {
      const visits = await Visit.find({ linkId: { $in: linkIds } })
        .sort({ visitedAt: -1 })
        .lean();

      visits.forEach((v) => {
        const key = v.linkId.toString();
        if (!recentVisitsMap[key]) recentVisitsMap[key] = [];
        if (recentVisitsMap[key].length < 50) recentVisitsMap[key].push(v);
      });
    }

    const enrichedLinks = links.map((link) => {
      const linkVisits = recentVisitsMap[link._id.toString()] || [];
      const healthScore = computeHealthScore(link, linkVisits);
      return {
        ...link,
        shortUrl: buildShortUrl(link.alias || link.shortCode),
        isExpired: isLinkExpired(link.expiryDate),
        healthScore,
        healthBadge: getHealthBadge(healthScore),
      };
    });

    res.status(200).json({
      success: true,
      data: {
        links: enrichedLinks,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    logger.error(`GetLinks error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch links.',
    });
  }
};

/**
 * GET /api/links/:id
 * Get a single link by ID (user-scoped)
 */
const getLinkById = async (req, res) => {
  try {
    const { id } = req.params;
    const link = await Link.findOne({ _id: id, userId: req.userId });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found.',
      });
    }

    const enriched = await enrichLink(link);

    res.status(200).json({
      success: true,
      data: { link: enriched },
    });
  } catch (error) {
    logger.error(`GetLinkById error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch link.' });
  }
};

/**
 * PUT /api/links/:id
 * Update a link (user-scoped)
 */
const updateLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { originalUrl, alias, title, expiryOption, status, tags } = req.body;

    const link = await Link.findOne({ _id: id, userId: req.userId });
    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found.' });
    }

    // Check new alias availability
    if (alias !== undefined && alias !== link.alias) {
      const aliasExists = await Link.findOne({
        $or: [{ alias }, { shortCode: alias }],
        _id: { $ne: id },
      });
      if (aliasExists) {
        return res.status(409).json({
          success: false,
          message: 'This alias is already taken.',
        });
      }
    }

    // Apply updates
    if (originalUrl !== undefined) link.originalUrl = originalUrl;
    if (alias !== undefined) {
      link.alias = alias || null;
      // Regenerate QR code with new alias
      const shortUrl = buildShortUrl(link.alias || link.shortCode);
      link.qrCode = await generateQRCode(shortUrl);
    }
    if (title !== undefined) link.title = title || null;
    if (tags !== undefined) link.tags = tags;
    if (status !== undefined && ['active', 'disabled'].includes(status)) {
      link.status = status;
    }
    if (expiryOption !== undefined) {
      link.expiryOption = expiryOption;
      link.expiryDate = calculateExpiryDate(expiryOption);
      // Auto-update status based on new expiry
      if (link.expiryDate && new Date() > link.expiryDate) {
        link.status = 'expired';
      } else if (link.status === 'expired' && (!link.expiryDate || new Date() <= link.expiryDate)) {
        link.status = 'active';
      }
    }

    await link.save();

    const enriched = await enrichLink(link);

    res.status(200).json({
      success: true,
      message: 'Link updated successfully.',
      data: { link: enriched },
    });
  } catch (error) {
    logger.error(`UpdateLink error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to update link.' });
  }
};

/**
 * DELETE /api/links/:id
 * Delete a link and all its visits (user-scoped)
 */
const deleteLink = async (req, res) => {
  try {
    const { id } = req.params;
    const link = await Link.findOne({ _id: id, userId: req.userId });

    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found.' });
    }

    // Delete link and associated visits
    await Promise.all([
      Link.deleteOne({ _id: id }),
      Visit.deleteMany({ linkId: id }),
    ]);

    logger.info(`Link deleted: ${link.shortCode} by user ${req.userId}`);

    res.status(200).json({
      success: true,
      message: 'Link and its analytics deleted successfully.',
    });
  } catch (error) {
    logger.error(`DeleteLink error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to delete link.' });
  }
};

/**
 * PATCH /api/links/:id/favorite
 * Toggle favorite status of a link
 */
const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const link = await Link.findOne({ _id: id, userId: req.userId });

    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found.' });
    }

    link.isFavorite = !link.isFavorite;
    await link.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: link.isFavorite ? 'Added to favorites.' : 'Removed from favorites.',
      data: { isFavorite: link.isFavorite },
    });
  } catch (error) {
    logger.error(`ToggleFavorite error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to update favorite status.' });
  }
};

/**
 * POST /api/links/:id/duplicate
 * Duplicate a link with a new short code
 */
const duplicateLink = async (req, res) => {
  try {
    const { id } = req.params;
    const original = await Link.findOne({ _id: id, userId: req.userId });

    if (!original) {
      return res.status(404).json({ success: false, message: 'Link not found.' });
    }

    // Generate new unique short code
    let shortCode;
    let attempts = 0;
    do {
      shortCode = generateShortCode(7);
      attempts++;
    } while (await Link.findOne({ shortCode }) && attempts < 10);

    // Create duplicate (no alias to avoid conflicts)
    const shortUrl = buildShortUrl(shortCode);
    const qrCode = await generateQRCode(shortUrl);

    const duplicate = new Link({
      userId: req.userId,
      originalUrl: original.originalUrl,
      shortCode,
      alias: null,
      title: original.title ? `${original.title} (Copy)` : null,
      expiryOption: original.expiryOption,
      expiryDate: calculateExpiryDate(original.expiryOption),
      tags: original.tags,
      qrCode,
    });

    await duplicate.save();

    const enriched = await enrichLink(duplicate);

    logger.info(`Link duplicated: ${original.shortCode} -> ${shortCode} by user ${req.userId}`);

    res.status(201).json({
      success: true,
      message: 'Link duplicated successfully.',
      data: { link: enriched },
    });
  } catch (error) {
    logger.error(`DuplicateLink error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to duplicate link.' });
  }
};

/**
 * GET /api/links/:id/qr
 * Get/regenerate QR code for a link
 */
const getQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    const link = await Link.findOne({ _id: id, userId: req.userId });

    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found.' });
    }

    const shortUrl = buildShortUrl(link.alias || link.shortCode);

    // Check download format request
    const format = req.query.format || 'json';

    if (format === 'png') {
      const { generateQRCodeBuffer } = require('../utils/qrcode');
      const buffer = await generateQRCodeBuffer(shortUrl);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="qr-${link.shortCode}.png"`);
      return res.send(buffer);
    }

    if (format === 'svg') {
      const { generateQRCodeSVG } = require('../utils/qrcode');
      const svg = await generateQRCodeSVG(shortUrl);
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="qr-${link.shortCode}.svg"`);
      return res.send(svg);
    }

    // Default: return base64 data URL
    if (!link.qrCode) {
      link.qrCode = await generateQRCode(shortUrl);
      await link.save({ validateBeforeSave: false });
    }

    res.status(200).json({
      success: true,
      data: {
        qrCode: link.qrCode,
        shortUrl,
      },
    });
  } catch (error) {
    logger.error(`GetQRCode error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to generate QR code.' });
  }
};

/**
 * GET /api/links/check-alias
 * Check if an alias is available
 */
const checkAlias = async (req, res) => {
  try {
    const { alias } = req.query;

    if (!alias) {
      return res.status(400).json({ success: false, message: 'Alias parameter is required.' });
    }

    if (!/^[a-z0-9-_]+$/.test(alias.toLowerCase())) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Alias contains invalid characters.',
      });
    }

    const exists = await Link.findOne({
      $or: [{ alias: alias.toLowerCase() }, { shortCode: alias.toLowerCase() }],
    });

    res.status(200).json({
      success: true,
      available: !exists,
      message: exists ? 'This alias is already taken.' : 'Alias is available.',
    });
  } catch (error) {
    logger.error(`CheckAlias error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to check alias.' });
  }
};

/**
 * GET /api/links/export
 * Export user's links as CSV
 */
const exportLinks = async (req, res) => {
  try {
    const links = await Link.find({ userId: req.userId }).lean();

    if (links.length === 0) {
      return res.status(404).json({ success: false, message: 'No links to export.' });
    }

    const exportData = links.map((link) => ({
      _id: link._id.toString(),
      originalUrl: link.originalUrl,
      shortCode: link.shortCode,
      alias: link.alias || '',
      shortUrl: buildShortUrl(link.alias || link.shortCode),
      clickCount: link.clickCount,
      status: isLinkExpired(link.expiryDate) ? 'expired' : link.status,
      isFavorite: link.isFavorite,
      expiryDate: link.expiryDate ? link.expiryDate.toISOString() : 'No expiry',
      createdAt: link.createdAt.toISOString(),
    }));

    // Simple CSV generation without json2csv dependency
    const headers = ['Link ID', 'Original URL', 'Short Code', 'Alias', 'Short URL', 'Click Count', 'Status', 'Is Favorite', 'Expiry Date', 'Created At'];
    const rows = exportData.map((row) =>
      [
        row._id,
        `"${row.originalUrl.replace(/"/g, '""')}"`,
        row.shortCode,
        row.alias,
        row.shortUrl,
        row.clickCount,
        row.status,
        row.isFavorite,
        row.expiryDate,
        row.createdAt,
      ].join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const filename = `linkpulse-export-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (error) {
    logger.error(`ExportLinks error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to export links.' });
  }
};

module.exports = {
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
};
