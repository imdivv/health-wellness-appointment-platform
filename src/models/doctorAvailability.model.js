import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const DoctorAvailability = sequelize.define('DoctorAvailability', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  dayOfWeek: {
    type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']],
        msg: 'dayOfWeek must be a valid day (Monday through Sunday)'
      }
    }
  },
  startTime: {
    type: DataTypes.TIME, // TIME represents 'HH:MM:SS' in Sequelize/MSSQL
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
  slotDuration: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: false,
    validate: {
      isInt: { msg: 'Slot duration must be an integer number of minutes' },
      min: { args: [5], msg: 'Slot duration must be at least 5 minutes' }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'DoctorAvailabilities',
  timestamps: true
});

export default DoctorAvailability;
