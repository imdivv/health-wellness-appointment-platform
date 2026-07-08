import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const MedicalRecord = sequelize.define('MedicalRecord', {
  recordId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  blobUrl: {
    type: DataTypes.STRING(2048),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Blob URL is required' }
    }
  },
  blobName: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Blob name is required' }
    }
  },
  documentType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Document type is required' }
    }
  }
}, {
  tableName: 'MedicalRecords',
  timestamps: true
});

export default MedicalRecord;
