import authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/responseHelper.js';

/**
 * Controller: Handles user registration requests.
 */
export const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    return sendSuccess(res, user, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Handles user credentials verification and login.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const authData = await authService.login(email, password);
    return sendSuccess(res, authData, 'User login successful', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Retrieves the currently authenticated user's profile.
 */
export const getProfile = async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user.id);
    return sendSuccess(res, profile, 'User profile retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Updates the authenticated user's profile properties.
 */
export const updateProfile = async (req, res, next) => {
  try {
    const updatedProfile = await authService.updateProfile(req.user.id, req.body);
    return sendSuccess(res, updatedProfile, 'User profile updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Changes the user's password.
 */
export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, oldPassword, newPassword);
    return sendSuccess(res, {}, 'Password changed successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Dispatches password recovery placeholders.
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const infoMessage = await authService.forgotPassword(email);
    return sendSuccess(res, {}, infoMessage, 200);
  } catch (error) {
    next(error);
  }
};
