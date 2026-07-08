import appointmentService from '../services/appointment.service.js';
import { sendSuccess } from '../utils/responseHelper.js';

/**
 * Controller: Handles appointment booking requests.
 */
export const bookAppointment = async (req, res, next) => {
  try {
    let patientId = req.user.id;

    // Admin role override to book on behalf of another patient account
    if (req.user.role === 'Admin' && req.body.patientId) {
      patientId = req.body.patientId;
    }

    const appointment = await appointmentService.book(patientId, req.body);
    return sendSuccess(res, appointment, 'Appointment booked successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Handles rescheduling requests.
 */
export const rescheduleAppointment = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await appointmentService.reschedule(appointmentId, req.user, req.body);
    return sendSuccess(res, appointment, 'Appointment rescheduled successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Cancels an appointment.
 */
export const cancelAppointment = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await appointmentService.cancel(appointmentId, req.user);
    return sendSuccess(res, appointment, 'Appointment cancelled successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Updates status (Only Doctors/Admins).
 */
export const updateStatus = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const { status } = req.body;
    const appointment = await appointmentService.updateStatus(appointmentId, req.user, status);
    return sendSuccess(res, appointment, `Appointment status updated to ${status} successfully`, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Resolves detailed appointment attributes.
 */
export const getDetails = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await appointmentService.getDetails(appointmentId, req.user);
    return sendSuccess(res, appointment, 'Appointment details resolved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Lists appointments matching role-based filters.
 */
export const listAppointments = async (req, res, next) => {
  try {
    const appointments = await appointmentService.list(req.user, req.query);
    return sendSuccess(res, appointments, 'Appointments list retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};
