import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Doctor = sequelize.define('Doctor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: {
      msg: 'A doctor profile already exists for this user account'
    }
  },
  specialization: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Specialization is required' }
    }
  },
  qualification: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Qualification is required' }
    }
  },
  experienceYears: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: 'Experience must be an integer number of years' },
      min: { args: [0], msg: 'Experience cannot be negative' }
    }
  },
  hospitalName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Hospital name is required' }
    }
  },
  consultationFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: { msg: 'Consultation fee must be a valid currency value' },
      min: { args: [0], msg: 'Consultation fee cannot be negative' }
    }
  }
}, {
  tableName: 'Doctors',
  timestamps: true
});

import DoctorAvailability from './doctorAvailability.model.js';
import Appointment from './appointment.model.js';

Doctor.hasMany(DoctorAvailability, { foreignKey: 'doctorId', as: 'availabilities', onDelete: 'CASCADE' });
DoctorAvailability.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

Doctor.hasMany(Appointment, { foreignKey: 'doctorId', as: 'appointments' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

export default Doctor;
