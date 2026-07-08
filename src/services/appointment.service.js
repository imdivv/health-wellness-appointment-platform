import { Op, Transaction } from 'sequelize';
import sequelize from '../config/db.js';
import Appointment from '../models/appointment.model.js';
import Doctor from '../models/doctor.model.js';
import User from '../models/user.model.js';
import DoctorAvailability from '../models/doctorAvailability.model.js';

/**
 * Helper: Converts time string (HH:MM:SS or HH:MM) to total minutes.
 */
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Helper: Resolves day of the week name for a YYYY-MM-DD string using UTC.
 */
const getDayOfWeekName = (dateString) => {
  const date = new Date(dateString);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getUTCDay()];
};

class AppointmentService {
  /**
   * Books a new appointment. Runs inside a SERIALIZABLE transaction to prevent race conditions.
   */
  async book(patientId, appointmentData) {
    const { doctorId, appointmentDate, startTime, endTime, notes } = appointmentData;

    // Validate that the appointment date and time are in the future
    const todayStr = new Date().toISOString().split('T')[0];
    if (appointmentDate === todayStr) {
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();
      const startMin = timeToMinutes(startTime);

      if (startMin <= currentMin) {
        const error = new Error('Appointment start time must be in the future');
        error.statusCode = 400;
        throw error;
      }
    }

    // Execute in a transaction to block concurrent write checks
    return await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
    }, async (t) => {
      // 1. Verify doctor exists
      const doctor = await Doctor.findByPk(doctorId, { transaction: t });
      if (!doctor) {
        const error = new Error('Doctor profile not found');
        error.statusCode = 404;
        throw error;
      }

      // 2. Validate Doctor Availability
      const dayOfWeek = getDayOfWeekName(appointmentDate);
      const availability = await DoctorAvailability.findOne({
        where: {
          doctorId,
          dayOfWeek,
          isActive: true
        },
        transaction: t
      });

      if (!availability) {
        const error = new Error(`Doctor is not available on ${dayOfWeek}s`);
        error.statusCode = 400;
        throw error;
      }

      const reqStart = timeToMinutes(startTime);
      const reqEnd = timeToMinutes(endTime);
      const availStart = timeToMinutes(availability.startTime);
      const availEnd = timeToMinutes(availability.endTime);

      if (reqStart < availStart || reqEnd > availEnd) {
        const error = new Error(`Requested slot exceeds doctor availability limits for ${dayOfWeek} (${availability.startTime.substring(0, 5)} - ${availability.endTime.substring(0, 5)})`);
        error.statusCode = 400;
        throw error;
      }

      // 3. Prevent Double Booking for the Doctor
      const doctorConflict = await Appointment.findOne({
        where: {
          doctorId,
          appointmentDate,
          status: { [Op.ne]: 'Cancelled' },
          [Op.and]: [
            { startTime: { [Op.lt]: endTime } },
            { endTime: { [Op.gt]: startTime } }
          ]
        },
        transaction: t
      });

      if (doctorConflict) {
        const error = new Error('The requested timeslot has already been booked with this doctor');
        error.statusCode = 409;
        throw error;
      }

      // 4. Prevent Overlapping Bookings for the Patient
      const patientConflict = await Appointment.findOne({
        where: {
          patientId,
          appointmentDate,
          status: { [Op.ne]: 'Cancelled' },
          [Op.and]: [
            { startTime: { [Op.lt]: endTime } },
            { endTime: { [Op.gt]: startTime } }
          ]
        },
        transaction: t
      });

      if (patientConflict) {
        const error = new Error('You already have another appointment scheduled during this timeslot');
        error.statusCode = 409;
        throw error;
      }

      // 5. Create Appointment (Default status is Pending)
      const appointment = await Appointment.create({
        patientId,
        doctorId,
        appointmentDate,
        startTime,
        endTime,
        status: 'Pending',
        notes
      }, { transaction: t });

      return appointment.toJSON();
    });
  }

  /**
   * Reschedules an existing appointment.
   */
  async reschedule(appointmentId, userContext, rescheduleData) {
    const { appointmentDate, startTime, endTime } = rescheduleData;

    // Validate future dates/times
    const todayStr = new Date().toISOString().split('T')[0];
    if (appointmentDate === todayStr) {
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();
      const startMin = timeToMinutes(startTime);

      if (startMin <= currentMin) {
        const error = new Error('Reschedule start time must be in the future');
        error.statusCode = 400;
        throw error;
      }
    }

    return await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
    }, async (t) => {
      // 1. Fetch appointment details
      const appointment = await Appointment.findByPk(appointmentId, { transaction: t });
      if (!appointment) {
        const error = new Error('Appointment not found');
        error.statusCode = 404;
        throw error;
      }

      if (appointment.status === 'Completed' || appointment.status === 'Cancelled') {
        const error = new Error(`Cannot reschedule an appointment that is already ${appointment.status.toLowerCase()}`);
        error.statusCode = 400;
        throw error;
      }

      // 2. Validate Ownership Permissions
      if (userContext.role === 'Patient' && appointment.patientId !== userContext.id) {
        const error = new Error('Access forbidden: You cannot reschedule another patient\'s appointment');
        error.statusCode = 403;
        throw error;
      }

      if (userContext.role === 'Doctor') {
        const doctorProfile = await Doctor.findOne({ where: { userId: userContext.id }, transaction: t });
        if (!doctorProfile || appointment.doctorId !== doctorProfile.id) {
          const error = new Error('Access forbidden: You can only reschedule appointments booked with you');
          error.statusCode = 403;
          throw error;
        }
      }

      // 3. Validate Doctor Availability for new date
      const dayOfWeek = getDayOfWeekName(appointmentDate);
      const availability = await DoctorAvailability.findOne({
        where: {
          doctorId: appointment.doctorId,
          dayOfWeek,
          isActive: true
        },
        transaction: t
      });

      if (!availability) {
        const error = new Error(`Doctor is not available on ${dayOfWeek}s`);
        error.statusCode = 400;
        throw error;
      }

      const reqStart = timeToMinutes(startTime);
      const reqEnd = timeToMinutes(endTime);
      const availStart = timeToMinutes(availability.startTime);
      const availEnd = timeToMinutes(availability.endTime);

      if (reqStart < availStart || reqEnd > availEnd) {
        const error = new Error(`Requested slot exceeds doctor availability limits for ${dayOfWeek} (${availability.startTime.substring(0, 5)} - ${availability.endTime.substring(0, 5)})`);
        error.statusCode = 400;
        throw error;
      }

      // 4. Verify Doctor has no conflict (excluding this appointment)
      const doctorConflict = await Appointment.findOne({
        where: {
          doctorId: appointment.doctorId,
          appointmentDate,
          id: { [Op.ne]: appointmentId },
          status: { [Op.ne]: 'Cancelled' },
          [Op.and]: [
            { startTime: { [Op.lt]: endTime } },
            { endTime: { [Op.gt]: startTime } }
          ]
        },
        transaction: t
      });

      if (doctorConflict) {
        const error = new Error('The requested timeslot has already been booked with this doctor');
        error.statusCode = 409;
        throw error;
      }

      // 5. Verify Patient has no conflict (excluding this appointment)
      const patientConflict = await Appointment.findOne({
        where: {
          patientId: appointment.patientId,
          appointmentDate,
          id: { [Op.ne]: appointmentId },
          status: { [Op.ne]: 'Cancelled' },
          [Op.and]: [
            { startTime: { [Op.lt]: endTime } },
            { endTime: { [Op.gt]: startTime } }
          ]
        },
        transaction: t
      });

      if (patientConflict) {
        const error = new Error('Patient already has another appointment scheduled during this timeslot');
        error.statusCode = 409;
        throw error;
      }

      // 6. Update fields. If doctor/admin changes it, mark Approved. Otherwise reset to Pending.
      appointment.appointmentDate = appointmentDate;
      appointment.startTime = startTime;
      appointment.endTime = endTime;
      appointment.status = (userContext.role === 'Doctor' || userContext.role === 'Admin') ? 'Approved' : 'Pending';

      await appointment.save({ transaction: t });
      return appointment.toJSON();
    });
  }

  /**
   * Cancels an appointment.
   */
  async cancel(appointmentId, userContext) {
    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      const error = new Error('Appointment not found');
      error.statusCode = 404;
      throw error;
    }

    if (appointment.status === 'Completed' || appointment.status === 'Cancelled') {
      const error = new Error(`Cannot cancel an appointment that is already ${appointment.status.toLowerCase()}`);
      error.statusCode = 400;
      throw error;
    }

    // Check permissions
    if (userContext.role === 'Patient' && appointment.patientId !== userContext.id) {
      const error = new Error('Access forbidden: You cannot cancel another patient\'s appointment');
      error.statusCode = 403;
      throw error;
    }

    if (userContext.role === 'Doctor') {
      const doctorProfile = await Doctor.findOne({ where: { userId: userContext.id } });
      if (!doctorProfile || appointment.doctorId !== doctorProfile.id) {
        const error = new Error('Access forbidden: You can only cancel appointments booked with you');
        error.statusCode = 403;
        throw error;
      }
    }

    appointment.status = 'Cancelled';
    await appointment.save();
    return appointment.toJSON();
  }

  /**
   * Updates appointment status (Only Doctors/Admins).
   */
  async updateStatus(appointmentId, userContext, newStatus) {
    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      const error = new Error('Appointment not found');
      error.statusCode = 404;
      throw error;
    }

    // Role block: Patients can only Cancel (handled by cancel endpoint)
    if (userContext.role !== 'Admin' && userContext.role !== 'Doctor') {
      const error = new Error('Access forbidden: Only doctors or administrators can update appointment statuses');
      error.statusCode = 403;
      throw error;
    }

    // Doctor ownership check
    if (userContext.role === 'Doctor') {
      const doctorProfile = await Doctor.findOne({ where: { userId: userContext.id } });
      if (!doctorProfile || appointment.doctorId !== doctorProfile.id) {
        const error = new Error('Access forbidden: You can only manage appointments booked with you');
        error.statusCode = 403;
        throw error;
      }
    }

    appointment.status = newStatus;
    await appointment.save();
    return appointment.toJSON();
  }

  /**
   * Retrieves single appointment details.
   */
  async getDetails(appointmentId, userContext) {
    const appointment = await Appointment.findByPk(appointmentId, {
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'fullName', 'email', 'phone']
        },
        {
          model: Doctor,
          as: 'doctor',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['fullName', 'email', 'phone']
            }
          ]
        }
      ]
    });

    if (!appointment) {
      const error = new Error('Appointment not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify view permissions
    if (userContext.role === 'Patient' && appointment.patientId !== userContext.id) {
      const error = new Error('Access forbidden: You do not have permissions to view this appointment');
      error.statusCode = 403;
      throw error;
    }

    if (userContext.role === 'Doctor') {
      const doctorProfile = await Doctor.findOne({ where: { userId: userContext.id } });
      if (!doctorProfile || appointment.doctorId !== doctorProfile.id) {
        const error = new Error('Access forbidden: You do not have permissions to view this appointment');
        error.statusCode = 403;
        throw error;
      }
    }

    return appointment.toJSON();
  }

  /**
   * Lists appointments with role-scoped boundaries.
   */
  async list(userContext, queryFilters = {}) {
    const where = {};
    const { status, appointmentDate, doctorId, patientId } = queryFilters;

    // Apply role-based query scopes
    if (userContext.role === 'Patient') {
      where.patientId = userContext.id;
    } else if (userContext.role === 'Doctor') {
      const doctorProfile = await Doctor.findOne({ where: { userId: userContext.id } });
      if (!doctorProfile) {
        return [];
      }
      where.doctorId = doctorProfile.id;
    } else if (userContext.role === 'Admin') {
      if (doctorId) where.doctorId = doctorId;
      if (patientId) where.patientId = patientId;
    }

    if (status) where.status = status;
    if (appointmentDate) where.appointmentDate = appointmentDate;

    const appointments = await Appointment.findAll({
      where,
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'fullName', 'email', 'phone']
        },
        {
          model: Doctor,
          as: 'doctor',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['fullName', 'specialization']
            }
          ]
        }
      ],
      order: [
        ['appointmentDate', 'ASC'],
        ['startTime', 'ASC']
      ]
    });

    return appointments.map(a => a.toJSON());
  }
}

export default new AppointmentService();
