import adminService from '../services/admin.service.js';
import { sendSuccess } from '../utils/responseHelper.js';

/**
 * Controller: Retrieves dashboard analytics statistics.
 */
export const getStats = async (req, res, next) => {
  try {
    const stats = await adminService.getSystemStats();
    return sendSuccess(res, stats, 'Dashboard analytics retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Resolves list of users.
 */
export const listUsers = async (req, res, next) => {
  try {
    const users = await adminService.listUsers(req.query);
    return sendSuccess(res, users, 'Users list retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Updates a user's role.
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    const updatedUser = await adminService.updateUserRole(userId, role);
    return sendSuccess(res, updatedUser, `User role updated to ${role} successfully`, 200);
  } catch (error) {
    next(error);
  }
};
