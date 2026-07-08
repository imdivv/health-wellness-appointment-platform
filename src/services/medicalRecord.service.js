import MedicalRecord from '../models/medicalRecord.model.js';
import User from '../models/user.model.js';
import blobService from './blob.service.js';

class MedicalRecordService {
  /**
   * Uploads a new medical document to Azure and records metadata in database.
   * @param {string} patientId - Patient user UUID
   * @param {Object} file - Multer file object (contains buffer and name)
   * @param {string} documentType - Document classification (e.g. Report, Prescription)
   * @returns {Promise<Object>} The registered record details
   */
  async upload(patientId, file, documentType) {
    // 1. Verify patient exists
    const patient = await User.findByPk(patientId);
    if (!patient) {
      const error = new Error('Patient user account not found');
      error.statusCode = 404;
      throw error;
    }

    if (patient.role !== 'Patient') {
      const error = new Error('Medical records can only be uploaded to Patient profiles');
      error.statusCode = 400;
      throw error;
    }

    // 2. Upload to Azure Blob Storage
    const { blobUrl, blobName } = await blobService.upload(file.buffer, file.originalname, file.mimetype);

    // 3. Save database metadata
    const record = await MedicalRecord.create({
      patientId,
      blobUrl,
      blobName,
      documentType: documentType || 'Unclassified'
    });

    return record.toJSON();
  }

  /**
   * Verifies access permission and generates a secure download link.
   * @param {string} recordId - MedicalRecord UUID
   * @param {Object} userContext - Requesting user data (id, role)
   * @returns {Promise<Object>} Temporary secure URL payload
   */
  async getDownloadLink(recordId, userContext) {
    const record = await MedicalRecord.findByPk(recordId);
    if (!record) {
      const error = new Error('Medical record file not found');
      error.statusCode = 404;
      throw error;
    }

    // Access authorization rules:
    // Patients can only access their own records. Doctors and Admins can access any record.
    if (userContext.role === 'Patient' && record.patientId !== userContext.id) {
      const error = new Error('Access forbidden: You cannot view another patient\'s medical records');
      error.statusCode = 403;
      throw error;
    }

    // Generate secure 15-minute SAS link
    const downloadUrl = await blobService.generateSasUrl(record.blobName);

    return {
      recordId: record.recordId,
      documentType: record.documentType,
      downloadUrl
    };
  }

  /**
   * Deletes a medical record from database metadata and Azure.
   * @param {string} recordId - MedicalRecord UUID
   * @param {Object} userContext - Requesting user data (id, role)
   * @returns {Promise<void>}
   */
  async delete(recordId, userContext) {
    const record = await MedicalRecord.findByPk(recordId);
    if (!record) {
      const error = new Error('Medical record file not found');
      error.statusCode = 404;
      throw error;
    }

    // Access authorization rules:
    // Patients can only delete their own records. Doctors and Admins can delete any record.
    if (userContext.role === 'Patient' && record.patientId !== userContext.id) {
      const error = new Error('Access forbidden: You cannot delete another patient\'s medical records');
      error.statusCode = 403;
      throw error;
    }

    // 1. Delete from Azure Blob Storage
    await blobService.delete(record.blobName);

    // 2. Delete database entry
    await record.destroy();
  }

  /**
   * Lists medical records scoped by user role.
   * @param {Object} userContext - Requesting user data
   * @param {string} patientIdFilter - Specific patient filter (optional, Admin/Doctor only)
   * @returns {Promise<Array>} List of records
   */
  async list(userContext, patientIdFilter) {
    const where = {};

    if (userContext.role === 'Patient') {
      where.patientId = userContext.id;
    } else {
      // Doctors/Admins must filter by patientId to view records, or list all if no filter is set
      if (patientIdFilter) {
        where.patientId = patientIdFilter;
      }
    }

    const records = await MedicalRecord.findAll({
      where,
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return records.map(r => r.toJSON());
  }
}

export default new MedicalRecordService();
