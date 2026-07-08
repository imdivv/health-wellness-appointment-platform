import { body } from 'express-validator';
import { validateFields } from './auth.validator.js';

const timeRegex = /^([0-1]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/**
 * Validation schema for booking an appointment
 */
export const bookAppointmentValidator = [
  body('doctorId')
    .trim()
    .notEmpty().withMessage('Doctor ID is required')
    .isUUID(4).withMessage('Doctor ID must be a valid UUID v4'),

  body('appointmentDate')
    .trim()
    .notEmpty().withMessage('Appointment date is required')
    .isISO8601().withMessage('Appointment date must be a valid ISO8601 date (YYYY-MM-DD)')
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const appointmentDate = new Date(value);
      if (appointmentDate < today) {
        throw new Error('Appointment date cannot be in the past');
      }
      return true;
    }),

  body('startTime')
    .trim()
    .notEmpty().withMessage('Start time is required')
    .matches(timeRegex).withMessage('Start time must be in HH:MM format'),

  body('endTime')
    .trim()
    .notEmpty().withMessage('End time is required')
    .matches(timeRegex).withMessage('End time must be in HH:MM format')
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

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),

  validateFields
];

/**
 * Validation schema for rescheduling an appointment
 */
export const rescheduleValidator = [
  body('appointmentDate')
    .trim()
    .notEmpty().withMessage('New appointment date is required')
    .isISO8601().withMessage('Appointment date must be a valid ISO8601 date (YYYY-MM-DD)')
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const appointmentDate = new Date(value);
      if (appointmentDate < today) {
        throw new Error('New appointment date cannot be in the past');
      }
      return true;
    }),

  body('startTime')
    .trim()
    .notEmpty().withMessage('New start time is required')
    .matches(timeRegex).withMessage('Start time must be in HH:MM format'),

  body('endTime')
    .trim()
    .notEmpty().withMessage('New end time is required')
    .matches(timeRegex).withMessage('End time must be in HH:MM format')
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

  validateFields
];

/**
 * Validation schema for updating appointment status
 */
export const statusValidator = [
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['Pending', 'Approved', 'Completed', 'Cancelled'])
    .withMessage('Status must be one of: Pending, Approved, Completed, Cancelled'),

  validateFields
];
