import { body, validationResult } from 'express-validator';
import { sendError } from '../utils/responseHelper.js';

/**
 * Middleware: Evaluates express-validator results.
 * If any inputs fail validation, responds immediately with 400 Bad Request.
 */
export const validateFields = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    return sendError(res, 'Validation failed: Invalid inputs', formattedErrors, 400);
  }
  next();
};

/**
 * Validation schema for User Registration
 */
export const registerValidator = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ max: 100 }).withMessage('Full name cannot exceed 100 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Please enter a valid phone number (e.g., +1234567890 in E.164 format)'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&#^()_+=\-[\]{}|;:',.<>/?~`]/).withMessage('Password must contain at least one special character'),

  body('role')
    .trim()
    .notEmpty().withMessage('Role is required')
    .isIn(['Admin', 'Doctor', 'Patient']).withMessage('Role must be one of: Admin, Doctor, Patient'),

  body('preferredLanguage')
    .optional()
    .trim()
    .isLength({ max: 10 }).withMessage('Preferred language code cannot exceed 10 characters')
];

/**
 * Validation schema for User Login
 */
export const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please enter a valid email address'),

  body('password')
    .notEmpty().withMessage('Password is required')
];

/**
 * Validation schema for Profile updates
 */
export const updateProfileValidator = [
  body('fullName')
    .optional()
    .trim()
    .notEmpty().withMessage('Full name cannot be empty')
    .isLength({ max: 100 }).withMessage('Full name cannot exceed 100 characters'),

  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Please enter a valid phone number'),

  body('preferredLanguage')
    .optional()
    .trim()
    .isLength({ max: 10 }).withMessage('Preferred language code cannot exceed 10 characters')
];

/**
 * Validation schema for Password modification
 */
export const changePasswordValidator = [
  body('oldPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('New password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('New password must contain at least one number')
    .matches(/[@$!%*?&#^()_+=\-[\]{}|;:',.<>/?~`]/).withMessage('New password must contain at least one special character')
    .custom((value, { req }) => {
      if (value === req.body.oldPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    })
];
