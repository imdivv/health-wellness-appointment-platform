/**
 * Sends a standardized success response.
 * @param {Object} res - Express response object
 * @param {Object} data - Payload data to send
 * @param {string} message - Success message description
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Sends a standardized error response.
 * @param {Object} res - Express response object
 * @param {string} message - Error description message
 * @param {Array} errors - Array of validation or structured errors
 * @param {number} statusCode - HTTP status code (default: 500)
 */
export const sendError = (res, message = 'An error occurred', errors = [], statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors]
  });
};
