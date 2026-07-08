import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('Email', 'SMS'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['Email', 'SMS']],
        msg: 'Notification type must be Email or SMS'
      }
    }
  },
  recipient: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Recipient details are required' }
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Title is required' }
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Message is required' }
    }
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Sent', 'Failed'),
    defaultValue: 'Pending',
    allowNull: false,
    validate: {
      isIn: {
        args: [['Pending', 'Sent', 'Failed']],
        msg: 'Invalid notification status'
      }
    }
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'Notifications',
  timestamps: true
});

export default Notification;
