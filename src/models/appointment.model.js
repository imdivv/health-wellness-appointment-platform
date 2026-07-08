import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  appointmentDate: {
    type: DataTypes.DATEONLY, // Holds date only (YYYY-MM-DD)
    allowNull: false,
    validate: {
      isDate: { msg: 'Please enter a valid date' }
    }
  },
  startTime: {
    type: DataTypes.TIME, // Holds time only (HH:MM:SS)
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Start time is required' }
    }
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'End time is required' }
    }
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Completed', 'Cancelled'),
    defaultValue: 'Pending',
    allowNull: false,
    validate: {
      isIn: {
        args: [['Pending', 'Approved', 'Completed', 'Cancelled']],
        msg: 'Invalid appointment status'
      }
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'Appointments',
  timestamps: true
});

export default Appointment;
