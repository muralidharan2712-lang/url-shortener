const Link = require('../models/Link');
const Visit = require('../models/Visit');
const { isLinkExpired, parseUserAgent } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * GET /:shortCode
 * Handle short URL redirect with full analytics tracking
 *
 * Flow:
 * 1. Find link by short code or alias
 * 2. Validate link exists
 * 3. Check expiry
 * 4. Increment click count
 * 5. Save visit history
 * 6. Update analytics metadata
 * 7. Redirect to original URL
 */
const handleRedirect = async (req, res) => {
  const { shortCode } = req.params;

  try {
    // 1. Find link by short code or alias
    const link = await Link.findByCode(shortCode);

    // 2. Validate link exists
    if (!link) {
      // Redirect to frontend 404 page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(302, `${frontendUrl}/not-found?code=${shortCode}`);
    }

    // 3. Check if link is disabled
    if (link.status === 'disabled') {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(302, `${frontendUrl}/not-found?code=${shortCode}&reason=disabled`);
    }

    // 4. Check expiry
    if (isLinkExpired(link.expiryDate)) {
      // Update status in DB if not already marked
      if (link.status !== 'expired') {
        link.status = 'expired';
        await link.save({ validateBeforeSave: false });
      }
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(302, `${frontendUrl}/expired?code=${shortCode}`);
    }

    // 5 & 6. Increment click count and update metadata (don't await - fire and forget for speed)
    const now = new Date();
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const referer = req.headers.referer || req.headers.referrer || null;
    const device = Visit.detectDevice(userAgent);

    // Atomic increment of click count
    Link.findByIdAndUpdate(
      link._id,
      {
        $inc: { clickCount: 1 },
        $set: { lastVisitedAt: now },
      },
      { new: true }
    ).exec().catch((err) => logger.error(`Click increment error: ${err.message}`));

    // 7. Save visit document
    Visit.create({
      linkId: link._id,
      userId: link.userId,
      visitedAt: now,
      ipAddress: ipAddress.replace(/^::ffff:/, ''), // normalize IPv4-mapped IPv6
      userAgent: userAgent.substring(0, 512), // truncate long UA strings
      referer: referer ? referer.substring(0, 512) : null,
      device,
    }).catch((err) => logger.error(`Visit save error: ${err.message}`));

    logger.info(`Redirect: ${shortCode} -> ${link.originalUrl} [${device}]`);

    // 8. Redirect to original URL
    res.redirect(301, link.originalUrl);
  } catch (error) {
    logger.error(`Redirect error for ${shortCode}: ${error.message}`);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(302, `${frontendUrl}/error`);
  }
};

module.exports = { handleRedirect };
