const { nanoid } = require('nanoid');

/**
 * Generate a unique short code for URL shortening
 * @param {number} size - Length of the short code (default 7)
 * @returns {string} - URL-safe short code
 */
const generateShortCode = (size = 7) => {
  // nanoid generates URL-safe characters by default (A-Za-z0-9_-)
  return nanoid(size);
};

/**
 * Validate a URL string
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
const isValidUrl = (url) => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * Calculate expiry date based on duration option
 * @param {string} expiry - 'never' | '1d' | '7d' | '30d'
 * @returns {Date|null} - Expiry date or null for no expiry
 */
const calculateExpiryDate = (expiry) => {
  if (!expiry || expiry === 'never') return null;

  const now = new Date();
  const durations = {
    '1d':  1,
    '7d':  7,
    '30d': 30,
  };

  const days = durations[expiry];
  if (!days) return null;

  now.setDate(now.getDate() + days);
  return now;
};

/**
 * Check if a link is expired
 * @param {Date|null} expiryDate - Expiry date to check
 * @returns {boolean} - Whether the link is expired
 */
const isLinkExpired = (expiryDate) => {
  if (!expiryDate) return false;
  return new Date() > new Date(expiryDate);
};

/**
 * Compute health score for a link (0–100)
 * Factors:
 *  - Has been clicked recently (last 7 days): +30
 *  - Is not expired: +25
 *  - Has custom alias: +15
 *  - Click count > 0: +20
 *  - Created recently (last 30 days): +10
 * @param {Object} link - Link document from DB
 * @param {Array}  recentVisits - Array of visit documents
 * @returns {number} - Health score 0–100
 */
const computeHealthScore = (link, recentVisits = []) => {
  let score = 0;

  // Not expired or no expiry
  if (!isLinkExpired(link.expiryDate)) {
    score += 25;
  }

  // Has click count > 0
  if (link.clickCount > 0) {
    score += 20;
  }

  // Has custom alias
  if (link.alias) {
    score += 15;
  }

  // Created within last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  if (new Date(link.createdAt) > thirtyDaysAgo) {
    score += 10;
  }

  // Has been visited in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentVisit = recentVisits.some(
    (v) => new Date(v.visitedAt) > sevenDaysAgo
  );
  if (recentVisit) {
    score += 30;
  }

  // Bonus for high click counts
  if (link.clickCount >= 100) score = Math.min(100, score + 10);
  else if (link.clickCount >= 50) score = Math.min(100, score + 5);
  else if (link.clickCount >= 10) score = Math.min(100, score + 3);

  return Math.min(100, score);
};

/**
 * Get health badge label based on score
 * @param {number} score
 * @returns {string}
 */
const getHealthBadge = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Critical';
};

/**
 * Build the full short URL from a short code or alias
 * @param {string} code - Short code or alias
 * @returns {string} - Full short URL
 */
const buildShortUrl = (code) => {
  return `${process.env.BASE_URL}/${code}`;
};

/**
 * Format bytes to human-readable size
 * @param {number} bytes
 * @returns {string}
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Parse user agent string to a simplified browser/OS string
 * @param {string} ua - User-Agent header
 * @returns {string}
 */
const parseUserAgent = (ua = '') => {
  if (!ua) return 'Unknown';
  if (ua.includes('Mobile')) return 'Mobile Browser';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Other';
};

module.exports = {
  generateShortCode,
  isValidUrl,
  calculateExpiryDate,
  isLinkExpired,
  computeHealthScore,
  getHealthBadge,
  buildShortUrl,
  formatBytes,
  parseUserAgent,
};
