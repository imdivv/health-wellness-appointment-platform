import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { env } from '../config/env.js';

/**
 * Authentication & User Management Service
 */
class AuthService {
  /**
   * Registers a new user in the platform.
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} The registered user profile (excl. password)
   */
  async register(userData) {
    const { email } = userData;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      const error = new Error('Email address already registered');
      error.statusCode = 409; // Conflict
      throw error;
    }

    // Create new user (automatically hashes password via model hooks)
    const newUser = await User.create(userData);

    // Return user object without the password field
    const userJson = newUser.toJSON();
    delete userJson.password;
    
    return userJson;
  }

  /**
   * Logs in a user and returns authentication tokens.
   * @param {string} email - User email address
   * @param {string} password - User raw password input
   * @returns {Promise<Object>} User data and Access/Refresh tokens
   */
  async login(email, password) {
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const error = new Error('Invalid email address or password');
      error.statusCode = 401;
      throw error;
    }

    // Match password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid email address or password');
      error.statusCode = 401;
      throw error;
    }

    // Generate JWT access token
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    // Generate JWT refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      env.jwtSecret,
      { expiresIn: '7d' } // Long-lived refresh token
    );

    const userJson = user.toJSON();
    delete userJson.password;

    return {
      user: userJson,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: env.jwtExpiresIn
      }
    };
  }

  /**
   * Retrieves a user's details by their ID.
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} The user profile
   */
  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      const error = new Error('User profile not found');
      error.statusCode = 404;
      throw error;
    }

    return user.toJSON();
  }

  /**
   * Updates user profile info.
   * @param {string} userId - User UUID
   * @param {Object} updateData - Profile fields to update
   * @returns {Promise<Object>} The updated user profile
   */
  async updateProfile(userId, updateData) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Destructure allowed update fields
    const { fullName, phone, preferredLanguage } = updateData;

    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (preferredLanguage !== undefined) user.preferredLanguage = preferredLanguage;

    await user.save();

    const updatedUser = user.toJSON();
    delete updatedUser.password;

    return updatedUser;
  }

  /**
   * Updates the user's password.
   * @param {string} userId - User UUID
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify current password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      const error = new Error('Incorrect current password');
      error.statusCode = 400;
      throw error;
    }

    // Update password (triggers hashing hook)
    user.password = newPassword;
    await user.save();
  }

  /**
   * Placeholder workflow for forgot password sequence.
   * @param {string} email - User email address
   * @returns {Promise<string>} Success message context
   */
  async forgotPassword(email) {
    const user = await User.findOne({ where: { email } });
    
    // In production, we return the same generic message to prevent email enumeration,
    // but check if the user exists under the hood to send the reset email.
    if (user) {
      console.log(`[AUTH SERVICE] Password reset requested for: ${email}. Dispatched recovery mail link placeholder.`);
    }

    return 'If that email address is in our system, a password reset link has been dispatched.';
  }
}

export default new AuthService();
