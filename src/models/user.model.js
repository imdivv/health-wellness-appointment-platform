import { DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fullName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Full name is required' }
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: {
      msg: 'Email address must be unique'
    },
    validate: {
      isEmail: { msg: 'Please enter a valid email address' },
      notEmpty: { msg: 'Email address is required' }
    }
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Phone number is required' }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Password is required' },
      len: {
        args: [8, 255],
        msg: 'Password must be between 8 and 255 characters long'
      }
    }
  },
  role: {
    type: DataTypes.ENUM('Admin', 'Doctor', 'Patient'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['Admin', 'Doctor', 'Patient']],
        msg: 'Role must be Admin, Doctor, or Patient'
      }
    }
  },
  preferredLanguage: {
    type: DataTypes.STRING(50),
    defaultValue: 'en',
    allowNull: false
  }
}, {
  tableName: 'Users',
  timestamps: true,
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

/**
 * Helper prototype method to verify candidate password match.
 * @param {string} candidatePassword - Password input by candidate
 * @returns {Promise<boolean>} True if matching, false otherwise
 */
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

import Doctor from './doctor.model.js';
import Appointment from './appointment.model.js';
import MedicalRecord from './medicalRecord.model.js';
import Notification from './notification.model.js';

User.hasOne(Doctor, { foreignKey: 'userId', as: 'doctorProfile', onDelete: 'CASCADE' });
Doctor.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Appointment, { foreignKey: 'patientId', as: 'appointments', onDelete: 'CASCADE' });
Appointment.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });

User.hasMany(MedicalRecord, { foreignKey: 'patientId', as: 'medicalRecords', onDelete: 'CASCADE' });
MedicalRecord.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default User;
