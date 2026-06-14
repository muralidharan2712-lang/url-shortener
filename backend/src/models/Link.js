const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    originalUrl: {
      type: String,
      required: [true, 'Original URL is required'],
      trim: true,
      maxlength: [2048, 'URL cannot exceed 2048 characters'],
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: [3, 'Short code must be at least 3 characters'],
      maxlength: [50, 'Short code cannot exceed 50 characters'],
    },
    alias: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
      sparse: true, // allows multiple null values
      maxlength: [50, 'Alias cannot exceed 50 characters'],
      match: [/^[a-z0-9-_]+$/, 'Alias can only contain letters, numbers, hyphens and underscores'],
    },
    title: {
      type: String,
      default: null,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'disabled'],
      default: 'active',
    },
    expiryOption: {
      type: String,
      enum: ['never', '1d', '7d', '30d'],
      default: 'never',
    },
    expiryDate: {
      type: Date,
      default: null,
      index: true,
    },
    clickCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastVisitedAt: {
      type: Date,
      default: null,
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
    qrCode: {
      type: String, // base64 data URL
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Compound index for userId + createdAt for efficient listing
linkSchema.index({ userId: 1, createdAt: -1 });
linkSchema.index({ userId: 1, isFavorite: 1 });
linkSchema.index({ userId: 1, status: 1 });
linkSchema.index({ shortCode: 1 });
linkSchema.index({ alias: 1 }, { sparse: true });

// Virtual: compute if link is currently expired
linkSchema.virtual('isExpired').get(function () {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

// Virtual: short URL
linkSchema.virtual('shortUrl').get(function () {
  const code = this.alias || this.shortCode;
  return `${process.env.BASE_URL}/${code}`;
});

// Pre-save middleware: auto-update status based on expiry
linkSchema.pre('save', function (next) {
  if (this.expiryDate && new Date() > this.expiryDate) {
    this.status = 'expired';
  }
  next();
});

// Static: find link by short code or alias
linkSchema.statics.findByCode = function (code) {
  return this.findOne({
    $or: [{ shortCode: code }, { alias: code }],
  });
};

const Link = mongoose.model('Link', linkSchema);

module.exports = Link;
