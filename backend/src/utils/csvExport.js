const { Parser } = require('@json2csv/plainjs');
const logger = require('./logger');

/**
 * Convert an array of link analytics objects to CSV format
 * @param {Array} data - Array of link objects with analytics
 * @returns {string} - CSV string
 */
const exportToCSV = (data) => {
  try {
    const fields = [
      { label: 'Link ID',        value: '_id' },
      { label: 'Original URL',   value: 'originalUrl' },
      { label: 'Short Code',     value: 'shortCode' },
      { label: 'Alias',          value: 'alias' },
      { label: 'Short URL',      value: 'shortUrl' },
      { label: 'Click Count',    value: 'clickCount' },
      { label: 'Status',         value: 'status' },
      { label: 'Is Favorite',    value: 'isFavorite' },
      { label: 'Expiry Date',    value: 'expiryDate' },
      { label: 'Health Score',   value: 'healthScore' },
      { label: 'Created At',     value: 'createdAt' },
    ];

    const parser = new Parser({ fields });
    return parser.parse(data);
  } catch (error) {
    logger.error(`CSV export failed: ${error.message}`);
    throw new Error('Failed to export data as CSV');
  }
};

/**
 * Convert analytics visit data to CSV format
 * @param {Array} visits - Array of visit documents
 * @param {Object} link - Link document
 * @returns {string} - CSV string
 */
const exportAnalyticsToCSV = (visits, link) => {
  try {
    const rows = visits.map((visit) => ({
      'Short Code': link.shortCode,
      'Original URL': link.originalUrl,
      'Visit Date': new Date(visit.visitedAt).toISOString(),
      'Day': new Date(visit.visitedAt).toLocaleDateString('en-US', { weekday: 'long' }),
      'Hour': new Date(visit.visitedAt).getHours(),
    }));

    const fields = [
      'Short Code',
      'Original URL',
      'Visit Date',
      'Day',
      'Hour',
    ];

    const parser = new Parser({ fields });
    return parser.parse(rows);
  } catch (error) {
    logger.error(`Analytics CSV export failed: ${error.message}`);
    throw new Error('Failed to export analytics as CSV');
  }
};

module.exports = { exportToCSV, exportAnalyticsToCSV };
