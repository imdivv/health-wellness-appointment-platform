import { Router } from 'express';
import * as doctorController from '../controllers/doctor.controller.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import {
  createDoctorValidator,
  updateDoctorValidator,
  availabilityValidator
} from '../validators/doctor.validator.js';

const router = Router();

/**
 * @openapi
 * /doctors:
 *   get:
 *     summary: List Doctors
 *     description: Returns a list of doctors. Optional query parameters support partial filtering by specialization and hospitalName.
 *     tags:
 *       - Doctor Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *         description: Partial specialization match (e.g., Cardiology)
 *       - in: query
 *         name: hospitalName
 *         schema:
 *           type: string
 *         description: Partial hospital name match
 *     responses:
 *       200:
 *         description: Doctors list retrieved successfully.
 *       401:
 *         description: Unauthorized.
 */
router.get('/', authenticateJWT, doctorController.listDoctors);

/**
 * @openapi
 * /doctors/{id}:
 *   get:
 *     summary: Get Doctor Profile
 *     description: Resolves doctor profile attributes, including associated user credentials and available schedules.
 *     tags:
 *       - Doctor Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Doctor Profile UUID
 *     responses:
 *       200:
 *         description: Doctor profile resolved successfully.
 *       404:
 *         description: Doctor profile not found.
 */
router.get('/:id', authenticateJWT, doctorController.getProfile);

/**
 * @openapi
 * /doctors:
 *   post:
 *     summary: Create Doctor Profile
 *     description: Initializes a doctor details profile. Requesters can only create profiles for their own accounts unless they are Admins.
 *     tags:
 *       - Doctor Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - specialization
 *               - qualification
 *               - experienceYears
 *               - hospitalName
 *               - consultationFee
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: "d3b07384-d113-4956-a5cc-96e088fa0d5d"
 *               specialization:
 *                 type: string
 *                 example: "Cardiology"
 *               qualification:
 *                 type: string
 *                 example: "MD, FACC"
 *               experienceYears:
 *                 type: integer
 *                 example: 12
 *               hospitalName:
 *                 type: string
 *                 example: "General Wellness Hospital"
 *               consultationFee:
 *                 type: number
 *                 example: 150.00
 *     responses:
 *       201:
 *         description: Doctor profile created.
 *       400:
 *         description: Validator validation failed or invalid user role.
 *       403:
 *         description: Forbidden permissions.
 *       409:
 *         description: Profile already exists.
 */
router.post('/', authenticateJWT, authorizeRoles('Admin', 'Doctor'), createDoctorValidator, doctorController.createProfile);

/**
 * @openapi
 * /doctors/{id}:
 *   put:
 *     summary: Update Doctor Profile
 *     description: Updates qualifications, fees, or hospital location properties. Limited to the profile owner or Admins.
 *     tags:
 *       - Doctor Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Doctor Profile UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               specialization:
 *                 type: string
 *                 example: "Interventional Cardiology"
 *               hospitalName:
 *                 type: string
 *                 example: "City Heart Institute"
 *               consultationFee:
 *                 type: number
 *                 example: 175.00
 *     responses:
 *       200:
 *         description: Doctor profile updated.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Doctor profile not found.
 */
router.put('/:id', authenticateJWT, authorizeRoles('Admin', 'Doctor'), updateDoctorValidator, doctorController.updateProfile);

/**
 * @openapi
 * /doctors/{id}:
 *   delete:
 *     summary: Delete Doctor Profile
 *     description: Deletes a doctor profile. Limited to the profile owner or Admins.
 *     tags:
 *       - Doctor Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Doctor Profile UUID
 *     responses:
 *       200:
 *         description: Profile deleted successfully.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Profile not found.
 */
router.delete('/:id', authenticateJWT, authorizeRoles('Admin', 'Doctor'), doctorController.deleteProfile);

/**
 * @openapi
 * /doctors/{doctorId}/availability:
 *   get:
 *     summary: Get Availability Slots
 *     description: Lists all availability schedule blocks for a doctor.
 *     tags:
 *       - Doctor Availability
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Doctor Profile UUID
 *     responses:
 *       200:
 *         description: Availability list resolved.
 *       404:
 *         description: Doctor not found.
 */
router.get('/:doctorId/availability', authenticateJWT, doctorController.listAvailability);

/**
 * @openapi
 * /doctors/{doctorId}/availability:
 *   post:
 *     summary: Add Availability Slot
 *     description: Inserts a schedule range (e.g., Monday 09:00 to 17:00). Performs queries to prevent overlapping active blocks.
 *     tags:
 *       - Doctor Availability
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Doctor Profile UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dayOfWeek
 *               - startTime
 *               - endTime
 *               - slotDuration
 *             properties:
 *               dayOfWeek:
 *                 type: string
 *                 enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
 *                 example: Monday
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *               endTime:
 *                 type: string
 *                 example: "12:00"
 *               slotDuration:
 *                 type: integer
 *                 example: 30
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       210:
 *         description: Availability slot added.
 *       409:
 *         description: Scheduling conflict (overlapping slots).
 */
router.post('/:doctorId/availability', authenticateJWT, authorizeRoles('Admin', 'Doctor'), availabilityValidator, doctorController.addAvailability);

/**
 * @openapi
 * /doctors/{doctorId}/availability/{availabilityId}:
 *   put:
 *     summary: Update Availability Slot
 *     description: Modifies times or slot parameters. Re-runs queries to prevent overlaps on updates.
 *     tags:
 *       - Doctor Availability
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Doctor Profile UUID
 *       - in: path
 *         name: availabilityId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Availability Slot UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dayOfWeek:
 *                 type: string
 *                 example: Monday
 *               startTime:
 *                 type: string
 *                 example: "10:00"
 *               endTime:
 *                 type: string
 *                 example: "13:00"
 *               slotDuration:
 *                 type: integer
 *                 example: 30
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Slot updated successfully.
 *       409:
 *         description: Scheduling conflict (overlapping slot).
 */
router.put('/:doctorId/availability/:availabilityId', authenticateJWT, authorizeRoles('Admin', 'Doctor'), availabilityValidator, doctorController.updateAvailability);

/**
 * @openapi
 * /doctors/{doctorId}/availability/{availabilityId}:
 *   delete:
 *     summary: Delete Availability Slot
 *     description: Removes an availability slot.
 *     tags:
 *       - Doctor Availability
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Doctor Profile UUID
 *       - in: path
 *         name: availabilityId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Availability Slot UUID
 *     responses:
 *       200:
 *         description: Slot deleted successfully.
 *       404:
 *         description: Slot not found.
 */
router.delete('/:doctorId/availability/:availabilityId', authenticateJWT, authorizeRoles('Admin', 'Doctor'), doctorController.deleteAvailability);

export default router;
