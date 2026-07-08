import doctorService from '../services/doctor.service.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * Authorization check helper: Confirms if the requester is an Admin
 * or is the Doctor user who owns this profile.
 */
const hasModifyPermission = async (req, doctorId) => {
  if (req.user.role === 'Admin') return true;
  
  try {
    const doctor = await doctorService.getProfile(doctorId);
    return doctor.userId === req.user.id;
  } catch (error) {
    return false;
  }
};

/**
 * Controller: Creates a doctor profile.
 */
export const createProfile = async (req, res, next) => {
  try {
    // Only Admin can assign profile to another user. Otherwise, doctors can only register themselves.
    if (req.user.role !== 'Admin' && req.body.userId !== req.user.id) {
      return sendError(res, 'Access forbidden: You cannot initialize a profile for another user account', [], 403);
    }

    const profile = await doctorService.createProfile(req.body);
    return sendSuccess(res, profile, 'Doctor profile created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Retrieves a single doctor profile details.
 */
export const getProfile = async (req, res, next) => {
  try {
    const doctorId = req.params.id;
    const profile = await doctorService.getProfile(doctorId);
    return sendSuccess(res, profile, 'Doctor profile retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Lists doctor profiles with optional query filters.
 */
export const listDoctors = async (req, res, next) => {
  try {
    const profiles = await doctorService.listDoctors(req.query);
    return sendSuccess(res, profiles, 'Doctors list retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Updates doctor profile details.
 */
export const updateProfile = async (req, res, next) => {
  try {
    const doctorId = req.params.id;

    if (!(await hasModifyPermission(req, doctorId))) {
      return sendError(res, 'Access forbidden: You do not have permissions to modify this profile', [], 403);
    }

    const updatedProfile = await doctorService.updateProfile(doctorId, req.body);
    return sendSuccess(res, updatedProfile, 'Doctor profile updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Deletes a doctor profile.
 */
export const deleteProfile = async (req, res, next) => {
  try {
    const doctorId = req.params.id;

    if (!(await hasModifyPermission(req, doctorId))) {
      return sendError(res, 'Access forbidden: You do not have permissions to delete this profile', [], 403);
    }

    await doctorService.deleteProfile(doctorId);
    return sendSuccess(res, {}, 'Doctor profile deleted successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Adds a schedule availability range.
 */
export const addAvailability = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    if (!(await hasModifyPermission(req, doctorId))) {
      return sendError(res, 'Access forbidden: You cannot modify schedules for another doctor', [], 403);
    }

    const availability = await doctorService.addAvailability(doctorId, req.body);
    return sendSuccess(res, availability, 'Availability schedule added successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Lists schedule availability ranges for a doctor.
 */
export const listAvailability = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const availabilities = await doctorService.listAvailability(doctorId);
    return sendSuccess(res, availabilities, 'Availability schedule retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Modifies an existing availability slot.
 */
export const updateAvailability = async (req, res, next) => {
  try {
    const { doctorId, availabilityId } = req.params;

    if (!(await hasModifyPermission(req, doctorId))) {
      return sendError(res, 'Access forbidden: You cannot update schedules for another doctor', [], 403);
    }

    const updatedSlot = await doctorService.updateAvailability(doctorId, availabilityId, req.body);
    return sendSuccess(res, updatedSlot, 'Availability slot updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Removes an availability slot.
 */
export const deleteAvailability = async (req, res, next) => {
  try {
    const { doctorId, availabilityId } = req.params;

    if (!(await hasModifyPermission(req, doctorId))) {
      return sendError(res, 'Access forbidden: You cannot delete schedules for another doctor', [], 403);
    }

    await doctorService.deleteAvailability(doctorId, availabilityId);
    return sendSuccess(res, {}, 'Availability slot deleted successfully', 200);
  } catch (error) {
    next(error);
  }
};
