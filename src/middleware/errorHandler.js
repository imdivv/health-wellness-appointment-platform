import { sendError } from '../utils/responseHelper.js';

/**
 * Global Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log the stack trace in development, only error message in production
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ [Error Stack]:', err.stack);
  } else {
    console.error('❌ [Error]:', err.message);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Handle Sequelize Database Validation Errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = 'Database validation failed';
    errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
  }

  // Handle JSON Web Token Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  // Handle Multer Upload Limits
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File size limit exceeded: Maximum allowed file size is 10 MB';
  }

  // Standardized response format
  return sendError(res, message, errors, statusCode);
};

/**
 * Wildcard route 404 handler
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource not found - API endpoint ${req.method} ${req.originalUrl} does not exist`);
  error.statusCode = 404;
  next(error);
};
