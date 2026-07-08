import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { sendError } from '../utils/responseHelper.js';

/**
 * Authentication Middleware: Validates JWT access token in the request headers.
 */
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Access denied: Authentication token required', [], 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    
    // Bind payload info to request context
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Authentication failed: Token has expired', [], 401);
    }
    return sendError(res, 'Authentication failed: Invalid token', [], 401);
  }
};

/**
 * Authorization Middleware: Checks if user's role has access to specific route resources.
 * @param {...string} roles - Permitted roles (e.g., 'Admin', 'Doctor', 'Patient')
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Access denied: User credentials not found', [], 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res, 
        `Access forbidden: User role '${req.user.role}' is not authorized to access this resource`, 
        [], 
        403
      );
    }

    next();
  };
};
