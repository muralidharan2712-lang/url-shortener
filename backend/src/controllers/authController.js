const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

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
