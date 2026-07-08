import medicalRecordService from '../services/medicalRecord.service.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * Controller: Uploads a medical document.
 */
export const uploadRecord = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'Validation failed: File attachment is required', [], 400);
    }

    let patientId = req.user.id;

    // Doctor/Admin can upload on behalf of a specific patient
    if ((req.user.role === 'Doctor' || req.user.role === 'Admin') && req.body.patientId) {
      patientId = req.body.patientId;
    }

    const { documentType } = req.body;

    const record = await medicalRecordService.upload(patientId, req.file, documentType);
    return sendSuccess(res, record, 'Medical document uploaded successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Generates a secure SAS link for downloading files.
 */
export const downloadRecord = async (req, res, next) => {
  try {
    const recordId = req.params.id;
    const downloadPayload = await medicalRecordService.getDownloadLink(recordId, req.user);
    return sendSuccess(res, downloadPayload, 'Secure download URL generated successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Removes a medical document from the database and Azure.
 */
export const deleteRecord = async (req, res, next) => {
  try {
    const recordId = req.params.id;
    await medicalRecordService.delete(recordId, req.user);
    return sendSuccess(res, {}, 'Medical record deleted successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Lists medical records.
 */
export const listRecords = async (req, res, next) => {
  try {
    const { patientId } = req.query;
    const records = await medicalRecordService.list(req.user, patientId);
    return sendSuccess(res, records, 'Medical records list retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};
