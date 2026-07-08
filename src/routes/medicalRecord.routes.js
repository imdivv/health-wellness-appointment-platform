import { Router } from 'express';
import * as medicalRecordController from '../controllers/medicalRecord.controller.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

/**
 * @openapi
 * /medical-records:
 *   get:
 *     summary: List Medical Records
 *     description: Lists medical records. Patients see only their records. Doctors and Admins can view any patient's records using the patientId query parameter.
 *     tags:
 *       - Medical Records
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: (Doctor/Admin only) Filter by patient ID
 *     responses:
 *       200:
 *         description: Records list retrieved.
 *       401:
 *         description: Unauthorized.
 */
router.get('/', authenticateJWT, medicalRecordController.listRecords);

/**
 * @openapi
 * /medical-records/upload:
 *   post:
 *     summary: Upload Medical Record
 *     description: Uploads a medical file (PDF, JPG, JPEG, PNG, max 10MB) to Azure Blob Storage and registers metadata in SQL database.
 *     tags:
 *       - Medical Records
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - documentType
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload (PDF, JPG, JPEG, PNG only, max 10MB)
 *               documentType:
 *                 type: string
 *                 example: "Lab Report"
 *                 description: Document classification
 *               patientId:
 *                 type: string
 *                 format: uuid
 *                 description: (Doctor/Admin only) Upload on behalf of patient
 *     responses:
 *       201:
 *         description: Document uploaded successfully.
 *       400:
 *         description: File missing or invalid type/size.
 *       401:
 *         description: Unauthorized access.
 */
router.post(
  '/upload',
  authenticateJWT,
  upload.single('file'), // Multer file interceptor
  medicalRecordController.uploadRecord
);

/**
 * @openapi
 * /medical-records/{id}/download:
 *   get:
 *     summary: Download Medical Record
 *     description: Generates a secure, 15-minute temporary download SAS link for retrieving the file directly from Azure storage. Restricted to record owner, Doctors, or Admins.
 *     tags:
 *       - Medical Records
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Medical Record UUID
 *     responses:
 *       200:
 *         description: Secure download URL payload returned successfully.
 *       403:
 *         description: Forbidden access.
 *       404:
 *         description: Record not found.
 */
router.get('/:id/download', authenticateJWT, medicalRecordController.downloadRecord);

/**
 * @openapi
 * /medical-records/{id}:
 *   delete:
 *     summary: Delete Medical Record
 *     description: Deletes medical record metadata from SQL Database and cleans up storage on Azure. Restricted to record owner, Doctors, or Admins.
 *     tags:
 *       - Medical Records
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Medical Record UUID
 *     responses:
 *       200:
 *         description: Record deleted.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Record not found.
 */
router.delete('/:id', authenticateJWT, medicalRecordController.deleteRecord);

export default router;
