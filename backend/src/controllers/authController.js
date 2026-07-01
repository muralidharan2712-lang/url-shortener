const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Create a nodemailer transporter using env SMTP settings.
 * Falls back to ethereal (test account) if no credentials configured.
 */
const createTransporter = () => {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: parseInt(process.env.EMAIL_PORT || '587') === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  // No SMTP configured — log reset URL instead (development fallback)
  return null;
};

/**
 * Generate a signed JWT token
 * @param {string} userId
 * @param {boolean} rememberMe - Use longer expiry if true
 * @returns {string}
 */
const generateToken = (userId, rememberMe = false) => {
  const expiresIn = rememberMe ? '30d' : (process.env.JWT_EXPIRES_IN || '7d');
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn });
};

/**
 * POST /api/auth/signup
 * Register a new user account
 */
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already taken
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user (password hashing done in model pre-save hook)
    const user = new User({
      name,
      email,
      passwordHash: password, // Will be hashed by pre-save hook
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    logger.error(`Signup error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to create account. Please try again.',
    });
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and return JWT
 */
const login = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    // Find user including password hash
    const user = await User.findByEmailWithPassword(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user._id.toString(), rememberMe);

    logger.info(`User logged in: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
};

/**
 * GET /api/auth/me
 * Return currently authenticated user profile
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    logger.error(`GetMe error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile.',
    });
  }
};

/**
 * PATCH /api/auth/profile
 * Update current user's profile (name)
 */
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name.trim();
    await user.save({ validateBeforeSave: true });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    logger.error(`UpdateProfile error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

module.exports = { signup, login, getMe, updateProfile };

/**
 * POST /api/auth/forgot-password
 * Send a password reset link to the user's email
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    // Find user — always return success to avoid email enumeration
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      // Don't reveal whether email exists — respond as success
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    // Generate a raw token (32 bytes = 64 hex chars)
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Store a SHA-256 hash of the token (never store raw tokens)
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    await user.save({ validateBeforeSave: false });

    // Build reset URL — points to frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;

    logger.info(`Password reset requested for: ${email}`);

    // Attempt to send email
    const transporter = createTransporter();

    if (transporter) {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'LinkPulse <noreply@linkpulse.app>',
        to: user.email,
        subject: 'LinkPulse — Password Reset Request',
        html: `
          <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0d1117; color: #f8fafc; padding: 32px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 28px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); width: 48px; height: 48px; border-radius: 12px; line-height: 48px; font-size: 24px;">⚡</div>
              <h1 style="margin: 16px 0 4px; font-size: 24px; font-weight: 800; color: #f8fafc;">LinkPulse</h1>
            </div>
            <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 8px; color: #f8fafc;">Reset Your Password</h2>
            <p style="color: #94a3b8; margin-bottom: 24px; line-height: 1.6;">
              You requested a password reset for your LinkPulse account. Click the button below to set a new password. This link expires in <strong style="color: #f97316;">1 hour</strong>.
            </p>
            <a href="${resetUrl}" style="display: block; background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 700; font-size: 15px; text-align: center; margin-bottom: 24px;">
              Reset Password
            </a>
            <p style="color: #64748b; font-size: 12px; line-height: 1.6;">
              If you didn't request a password reset, ignore this email — your password won't change.<br>
              For security, this link expires in 1 hour.
            </p>
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 24px 0;">
            <p style="color: #475569; font-size: 11px; text-align: center;">
              If the button doesn't work, copy this URL: <br>
              <span style="color: #f97316; word-break: break-all;">${resetUrl}</span>
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to: ${email}`);
    } else {
      // Development fallback — log the reset URL
      logger.warn(`[FORGOT PASSWORD - NO SMTP CONFIGURED] Reset URL for ${email}: ${resetUrl}`);
    }

    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    logger.error(`ForgotPassword error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to process request. Please try again.' });
  }
};

/**
 * POST /api/auth/reset-password/:token
 * Validate reset token and update password
 */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Reset token is required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Hash the incoming raw token to compare with stored hashed token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching (non-expired) token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }, // Token must not be expired
    }).select('+resetPasswordToken +resetPasswordExpires +passwordHash');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.',
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.passwordHash = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    logger.info(`Password successfully reset for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    logger.error(`ResetPassword error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to reset password. Please try again.' });
  }
};

module.exports = { signup, login, getMe, updateProfile, forgotPassword, resetPassword };
