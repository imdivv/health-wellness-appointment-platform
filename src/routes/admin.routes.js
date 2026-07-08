import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// Apply administrative credentials locks across all dashboard routes
router.use(authenticateJWT);
router.use(authorizeRoles('Admin'));

/**
 * @openapi
 * /admin/stats:
 *   get:
 *     summary: Retrieve System Analytics
 *     description: Aggregates patient/doctor counts, clinical scheduling breakdowns by status, average consult fees, and the 10 most recent notification dispatch logs.
 *     tags:
 *       - Admin Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats returned successfully.
 *       401:
 *         description: Invalid or expired token.
 *       403:
 *         description: Forbidden (Requires Admin role).
 */
router.get('/stats', adminController.getStats);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     summary: List Platform Users
 *     description: Lists users. Supports role filtering parameters.
 *     tags:
 *       - Admin Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [Admin, Doctor, Patient]
 *         description: Filter by user role
 *     responses:
 *       200:
 *         description: Users list retrieved.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get('/users', adminController.listUsers);

/**
 * @openapi
 * /admin/users/{id}/role:
 *   put:
 *     summary: Promote or demote user roles
 *     description: Modifies a user's system role (e.g. promoting Patient to Doctor).
 *     tags:
 *       - Admin Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [Admin, Doctor, Patient]
 *                 example: Doctor
 *     responses:
 *       200:
 *         description: User role updated successfully.
 *       400:
 *         description: Invalid role supplied.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: User not found.
 */
router.put('/users/:id/role', adminController.updateUserRole);

export default router;
