import { Router } from 'express';
import * as appointmentController from '../controllers/appointment.controller.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import {
  bookAppointmentValidator,
  rescheduleValidator,
  statusValidator
} from '../validators/appointment.validator.js';

const router = Router();

/**
 * @openapi
 * /appointments:
 *   get:
 *     summary: List Appointments
 *     description: Lists appointments. Patients see only theirs, Doctors view schedules booked with them, and Admins can view all.
 *     tags:
 *       - Appointment Scheduling
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Approved, Completed, Cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: appointmentDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Appointments list retrieved successfully.
 *       401:
 *         description: Unauthorized access.
 */
router.get('/', authenticateJWT, appointmentController.listAppointments);

/**
 * @openapi
 * /appointments/{id}:
 *   get:
 *     summary: Get Appointment Details
 *     description: Resolves specific appointment properties including doctor details and patient info.
 *     tags:
 *       - Appointment Scheduling
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Appointment UUID
 *     responses:
 *       200:
 *         description: Details resolved successfully.
 *       403:
 *         description: Forbidden access.
 *       404:
 *         description: Appointment not found.
 */
router.get('/:id', authenticateJWT, appointmentController.getDetails);

/**
 * @openapi
 * /appointments:
 *   post:
 *     summary: Book Appointment
 *     description: Submits a new booking request. Performs transaction-safe checks for doctor availability and prevents double-bookings.
 *     tags:
 *       - Appointment Scheduling
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorId
 *               - appointmentDate
 *               - startTime
 *               - endTime
 *             properties:
 *               doctorId:
 *                 type: string
 *                 format: uuid
 *                 example: "b3e0984a-9e7f-4421-bc76-0f8623b320d5"
 *               appointmentDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-07-15"
 *               startTime:
 *                 type: string
 *                 example: "10:00"
 *               endTime:
 *                 type: string
 *                 example: "10:30"
 *               notes:
 *                 type: string
 *                 example: "First consultation for checkup"
 *               patientId:
 *                 type: string
 *                 format: uuid
 *                 description: (Admin only override) Book on behalf of patient
 *     responses:
 *       201:
 *         description: Appointment booked.
 *       400:
 *         description: Requested slot is in the past or exceeds doctor availability.
 *       409:
 *         description: Scheduling conflict (doctor double-booked or patient overlapping appointment).
 */
router.post('/', authenticateJWT, bookAppointmentValidator, appointmentController.bookAppointment);

/**
 * @openapi
 * /appointments/{id}/reschedule:
 *   put:
 *     summary: Reschedule Appointment
 *     description: Changes date and times for a booking. Validates availability and double-booking limits. Resets status to Pending (unless modified by Doctor/Admin).
 *     tags:
 *       - Appointment Scheduling
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Appointment UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appointmentDate
 *               - startTime
 *               - endTime
 *             properties:
 *               appointmentDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-07-20"
 *               startTime:
 *                 type: string
 *                 example: "11:00"
 *               endTime:
 *                 type: string
 *                 example: "11:30"
 *     responses:
 *       200:
 *         description: Appointment rescheduled.
 *       409:
 *         description: Scheduling conflict.
 */
router.put('/:id/reschedule', authenticateJWT, rescheduleValidator, appointmentController.rescheduleAppointment);

/**
 * @openapi
 * /appointments/{id}/cancel:
 *   put:
 *     summary: Cancel Appointment
 *     description: Cancels an active appointment, freeing up the timeslot.
 *     tags:
 *       - Appointment Scheduling
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Appointment UUID
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully.
 *       400:
 *         description: Cannot cancel an appointment already cancelled or completed.
 */
router.put('/:id/cancel', authenticateJWT, appointmentController.cancelAppointment);

/**
 * @openapi
 * /appointments/{id}/status:
 *   put:
 *     summary: Update Appointment Status
 *     description: Updates booking status (e.g. Approved, Completed). Restricted to Doctors and Admins.
 *     tags:
 *       - Appointment Scheduling
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Appointment UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending, Approved, Completed, Cancelled]
 *                 example: Approved
 *     responses:
 *       200:
 *         description: Status updated.
 *       403:
 *         description: Forbidden permissions.
 */
router.put('/:id/status', authenticateJWT, authorizeRoles('Admin', 'Doctor'), statusValidator, appointmentController.updateStatus);

export default router;
