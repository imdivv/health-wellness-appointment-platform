import { body } from 'express-validator';
import { validateFields } from './auth.validator.js';

const timeRegex = /^([0-1]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/**
 * Validation schema for creating a Doctor profile
 */
export const createDoctorValidator = [
  body('userId')
    .trim()
    .notEmpty().withMessage('User ID is required')
    .isUUID(4).withMessage('User ID must be a valid UUID v4'),

  body('specialization')
    .trim()
    .notEmpty().withMessage('Specialization is required')
    .isLength({ max: 255 }).withMessage('Specialization cannot exceed 255 characters'),

  body('qualification')
    .trim()
    .notEmpty().withMessage('Qualification is required')
    .isLength({ max: 255 }).withMessage('Qualification cannot exceed 255 characters'),

  body('experienceYears')
    .notEmpty().withMessage('Years of experience is required')
    .isInt({ min: 0 }).withMessage('Experience must be a positive integer number of years'),

  body('hospitalName')
    .trim()
    .notEmpty().withMessage('Hospital name is required')
    .isLength({ max: 255 }).withMessage('Hospital name cannot exceed 255 characters'),

  body('consultationFee')
    .notEmpty().withMessage('Consultation fee is required')
    .isFloat({ min: 0 }).withMessage('Consultation fee must be a positive numeric amount'),

  validateFields
];

/**
 * Validation schema for updating a Doctor profile
 */
export const updateDoctorValidator = [
  body('specialization')
    .optional()
    .trim()
    .notEmpty().withMessage('Specialization cannot be empty')
    .isLength({ max: 255 }).withMessage('Specialization cannot exceed 255 characters'),

  body('qualification')
    .optional()
    .trim()
    .notEmpty().withMessage('Qualification cannot be empty')
    .isLength({ max: 255 }).withMessage('Qualification cannot exceed 255 characters'),

  body('experienceYears')
    .optional()
    .isInt({ min: 0 }).withMessage('Experience must be a positive integer number of years'),

  body('hospitalName')
    .optional()
    .trim()
    .notEmpty().withMessage('Hospital name cannot be empty')
    .isLength({ max: 255 }).withMessage('Hospital name cannot exceed 255 characters'),

  body('consultationFee')
    .optional()
    .isFloat({ min: 0 }).withMessage('Consultation fee must be a positive numeric amount'),

  validateFields
];

/**
 * Validation schema for Doctor Availability slots
 */
export const availabilityValidator = [
  body('dayOfWeek')
    .trim()
    .notEmpty().withMessage('Day of week is required')
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('dayOfWeek must be a valid day (Monday through Sunday)'),

  body('startTime')
    .trim()
    .notEmpty().withMessage('Start time is required')
    .matches(timeRegex).withMessage('Start time must be in HH:MM or HH:MM:SS format'),

  body('endTime')
    .trim()
    .notEmpty().withMessage('End time is required')
    .matches(timeRegex).withMessage('End time must be in HH:MM or HH:MM:SS format')
    .custom((value, { req }) => {
      const startTime = req.body.startTime;
      if (!startTime || !value) return true;

      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = value.split(':').map(Number);

      const startTotal = startHour * 60 + startMin;
      const endTotal = endHour * 60 + endMin;

      if (startTotal >= endTotal) {
        throw new Error('End time must be chronologically after start time');
      }
      return true;
    }),

  body('slotDuration')
    .notEmpty().withMessage('Slot duration is required')
    .isInt({ min: 5, max: 180 }).withMessage('Slot duration must be an integer between 5 and 180 minutes'),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean flag'),

  validateFields
];
