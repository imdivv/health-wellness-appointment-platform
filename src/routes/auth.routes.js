import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middleware/auth.js';
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
  validateFields
} from '../validators/auth.validator.js';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: User Registration
 *     description: Creates a new user profile with roles ('Admin', 'Doctor', 'Patient'). Password is automatically hashed.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - phone
 *               - password
 *               - role
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john.doe@example.com
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *               password:
 *                 type: string
 *                 example: SecureP@ss123
 *               role:
 *                 type: string
 *                 enum: [Admin, Doctor, Patient]
 *                 example: Patient
 *               preferredLanguage:
 *                 type: string
 *                 example: en
 *     responses:
 *       201:
 *         description: User registered successfully.
 *       400:
 *         description: Input validation failed.
 *       409:
 *         description: Email is already registered.
 */
router.post('/register', registerValidator, validateFields, authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: User Login
 *     description: Validates user credentials and issues short-lived Access and long-lived Refresh tokens.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 example: SecureP@ss123
 *     responses:
 *       200:
 *         description: Login successful. Returns user data and JWT tokens.
 *       401:
 *         description: Invalid email or password.
 */
router.post('/login', loginValidator, validateFields, authController.login);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Forgot Password
 *     description: Request a password reset linkage placeholder message.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: john.doe@example.com
 *     responses:
 *       200:
 *         description: Instruction dispatched message successfully returned.
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @openapi
 * /auth/profile:
 *   get:
 *     summary: Get Profile
 *     description: Fetches current authenticated user data. Requires JWT authorization header.
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile information fetched successfully.
 *       401:
 *         description: Access token invalid or expired.
 */
router.get('/profile', authenticateJWT, authController.getProfile);

/**
 * @openapi
 * /auth/profile:
 *   put:
 *     summary: Update Profile
 *     description: Modifies current profile fields (fullName, phone, preferredLanguage).
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Johnathan Doe
 *               phone:
 *                 type: string
 *                 example: +10987654321
 *               preferredLanguage:
 *                 type: string
 *                 example: fr
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 *       400:
 *         description: Input validation failed.
 *       401:
 *         description: Token expired or unauthorized.
 */
router.put('/profile', authenticateJWT, updateProfileValidator, validateFields, authController.updateProfile);

/**
 * @openapi
 * /auth/change-password:
 *   put:
 *     summary: Change Password
 *     description: Modifies current user password. Forces current verification and password strength rules.
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: SecureP@ss123
 *               newPassword:
 *                 type: string
 *                 example: NewSecureP@ss123
 *     responses:
 *       200:
 *         description: Password changed successfully.
 *       400:
 *         description: Verification match failed or weak new password.
 *       401:
 *         description: Token invalid or unauthorized.
 */
router.put('/change-password', authenticateJWT, changePasswordValidator, validateFields, authController.changePassword);

export default router;
