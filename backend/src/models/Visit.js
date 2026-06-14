const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
  {
    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      required: [true, 'Link ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    visitedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    referer: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      default: null,
    },
    device: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown',
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for analytics queries
visitSchema.index({ linkId: 1, visitedAt: -1 });
visitSchema.index({ linkId: 1, visitedAt: 1 });
visitSchema.index({ userId: 1, visitedAt: -1 });

// TTL index: auto-delete visits older than 1 year
visitSchema.index(
  { visitedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 365 }
);

/**
 * Detect device type from user agent string
 * @param {string} ua - User-Agent header
 * @returns {'mobile'|'tablet'|'desktop'|'unknown'}
 */
visitSchema.statics.detectDevice = (ua = '') => {
  if (!ua) return 'unknown';
  const ua_lower = ua.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua_lower))
    return 'tablet';
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua))
    return 'mobile';
  return 'desktop';
};

const Visit = mongoose.model('Visit', visitSchema);

module.exports = Visit;
