import { Op } from 'sequelize';
import Doctor from '../models/doctor.model.js';
import User from '../models/user.model.js';
import DoctorAvailability from '../models/doctorAvailability.model.js';

class DoctorService {
  /**
   * Creates a Doctor Profile for a registered user.
   * @param {Object} doctorData - Doctor profile details
   * @returns {Promise<Object>} The created doctor profile
   */
  async createProfile(doctorData) {
    const { userId } = doctorData;

    // Verify user exists and has the 'Doctor' role
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User account not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role !== 'Doctor') {
      const error = new Error('User role must be Doctor to initialize a Doctor profile');
      error.statusCode = 400;
      throw error;
    }

    // Check if doctor profile already exists
    const existingProfile = await Doctor.findOne({ where: { userId } });
    if (existingProfile) {
      const error = new Error('Doctor profile already exists for this user account');
      error.statusCode = 409;
      throw error;
    }

    const doctor = await Doctor.create(doctorData);
    return doctor.toJSON();
  }

  /**
   * Retrieves a doctor profile by Doctor ID.
   * @param {string} doctorId - Doctor UUID
   * @returns {Promise<Object>} Doctor details and associated User profile
   */
  async getProfile(doctorId) {
    const doctor = await Doctor.findByPk(doctorId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: { exclude: ['password'] }
        },
        {
          model: DoctorAvailability,
          as: 'availabilities'
        }
      ]
    });

    if (!doctor) {
      const error = new Error('Doctor profile not found');
      error.statusCode = 404;
      throw error;
    }

    return doctor.toJSON();
  }

  /**
   * Lists doctors with optional filtering by specialization and hospital.
   * @param {Object} query - Filter parameters
   * @returns {Promise<Array>} List of matching doctors
   */
  async listDoctors(query = {}) {
    const { specialization, hospitalName } = query;
    const where = {};

    if (specialization) {
      where.specialization = { [Op.like]: `%${specialization}%` };
    }
    if (hospitalName) {
      where.hospitalName = { [Op.like]: `%${hospitalName}%` };
    }

    const doctors = await Doctor.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: { exclude: ['password'] }
        }
      ]
    });

    return doctors.map(d => d.toJSON());
  }

  /**
   * Updates an existing doctor profile.
   * @param {string} doctorId - Doctor UUID
   * @param {Object} updateData - Profile fields to modify
   * @returns {Promise<Object>} Updated profile data
   */
  async updateProfile(doctorId, updateData) {
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      const error = new Error('Doctor profile not found');
      error.statusCode = 404;
      throw error;
    }

    const { specialization, qualification, experienceYears, hospitalName, consultationFee } = updateData;

    if (specialization !== undefined) doctor.specialization = specialization;
    if (qualification !== undefined) doctor.qualification = qualification;
    if (experienceYears !== undefined) doctor.experienceYears = experienceYears;
    if (hospitalName !== undefined) doctor.hospitalName = hospitalName;
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;

    await doctor.save();
    return doctor.toJSON();
  }

  /**
   * Deletes a doctor profile.
   * @param {string} doctorId - Doctor UUID
   * @returns {Promise<void>}
   */
  async deleteProfile(doctorId) {
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      const error = new Error('Doctor profile not found');
      error.statusCode = 404;
      throw error;
    }
    await doctor.destroy();
  }

  /**
   * Adds an availability range for a doctor.
   * Checks for time overlaps to guarantee double-bookings aren't possible.
   * @param {string} doctorId - Doctor UUID
   * @param {Object} availabilityData - Days and slot details
   * @returns {Promise<Object>} Created availability record
   */
  async addAvailability(doctorId, availabilityData) {
    // Verify doctor exists
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      const error = new Error('Doctor profile not found');
      error.statusCode = 404;
      throw error;
    }

    const { dayOfWeek, startTime, endTime, slotDuration, isActive } = availabilityData;

    // Overlap validation check
    const isSlotActive = isActive !== undefined ? isActive : true;
    if (isSlotActive) {
      const overlap = await DoctorAvailability.findOne({
        where: {
          doctorId,
          dayOfWeek,
          isActive: true,
          [Op.and]: [
            { startTime: { [Op.lt]: endTime } },
            { endTime: { [Op.gt]: startTime } }
          ]
        }
      });

      if (overlap) {
        const error = new Error('The specified availability slot overlaps with an existing schedule');
        error.statusCode = 409; // Conflict
        throw error;
      }
    }

    const availability = await DoctorAvailability.create({
      doctorId,
      dayOfWeek,
      startTime,
      endTime,
      slotDuration,
      isActive: isSlotActive
    });

    return availability.toJSON();
  }

  /**
   * Lists all availability records for a doctor.
   * @param {string} doctorId - Doctor UUID
   * @returns {Promise<Array>} List of availabilities
   */
  async listAvailability(doctorId) {
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      const error = new Error('Doctor profile not found');
      error.statusCode = 404;
      throw error;
    }

    const availabilities = await DoctorAvailability.findAll({
      where: { doctorId },
      order: [
        ['dayOfWeek', 'ASC'],
        ['startTime', 'ASC']
      ]
    });

    return availabilities.map(a => a.toJSON());
  }

  /**
   * Updates an existing availability slot.
   * Checks for overlapping slots during updates.
   * @param {string} doctorId - Doctor UUID
   * @param {string} availabilityId - Availability slot UUID
   * @param {Object} updateData - Slot details to update
   * @returns {Promise<Object>} Updated availability record
   */
  async updateAvailability(doctorId, availabilityId, updateData) {
    const availability = await DoctorAvailability.findOne({
      where: { id: availabilityId, doctorId }
    });

    if (!availability) {
      const error = new Error('Doctor availability slot not found');
      error.statusCode = 404;
      throw error;
    }

    const dayOfWeek = updateData.dayOfWeek || availability.dayOfWeek;
    const startTime = updateData.startTime || availability.startTime;
    const endTime = updateData.endTime || availability.endTime;
    const slotDuration = updateData.slotDuration !== undefined ? updateData.slotDuration : availability.slotDuration;
    const isActive = updateData.isActive !== undefined ? updateData.isActive : availability.isActive;

    // Overlap validation check
    if (isActive) {
      const overlap = await DoctorAvailability.findOne({
        where: {
          doctorId,
          dayOfWeek,
          isActive: true,
          id: { [Op.ne]: availabilityId },
          [Op.and]: [
            { startTime: { [Op.lt]: endTime } },
            { endTime: { [Op.gt]: startTime } }
          ]
        }
      });

      if (overlap) {
        const error = new Error('The updated slot overlaps with an existing active schedule slot');
        error.statusCode = 409;
        throw error;
      }
    }

    availability.dayOfWeek = dayOfWeek;
    availability.startTime = startTime;
    availability.endTime = endTime;
    availability.slotDuration = slotDuration;
    availability.isActive = isActive;

    await availability.save();
    return availability.toJSON();
  }

  /**
   * Deletes an availability slot.
   * @param {string} doctorId - Doctor UUID
   * @param {string} availabilityId - Availability slot UUID
   * @returns {Promise<void>}
   */
  async deleteAvailability(doctorId, availabilityId) {
    const availability = await DoctorAvailability.findOne({
      where: { id: availabilityId, doctorId }
    });

    if (!availability) {
      const error = new Error('Doctor availability slot not found');
      error.statusCode = 404;
      throw error;
    }

    await availability.destroy();
  }
}

export default new DoctorService();
