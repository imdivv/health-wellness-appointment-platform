import sequelize from '../config/db.js';
import User from '../models/user.model.js';
import Doctor from '../models/doctor.model.js';
import Appointment from '../models/appointment.model.js';
import Notification from '../models/notification.model.js';

class AdminService {
  /**
   * Lists all users in the system (with optional filtering).
   */
  async listUsers(filters = {}) {
    const { role } = filters;
    const where = {};
    if (role) {
      where.role = role;
    }

    return await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Modifies a user's role (e.g. promoting Patient to Doctor).
   */
  async updateUserRole(userId, newRole) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User account not found');
      error.statusCode = 404;
      throw error;
    }

    user.role = newRole;
    await user.save();
    
    const userJson = user.toJSON();
    delete userJson.password;
    return userJson;
  }

  /**
   * Views aggregate system metrics and clinical schedules statistics.
   */
  async getSystemStats() {
    const totalAppointments = await Appointment.count();
    const totalDoctors = await Doctor.count();
    const totalPatients = await User.count({ where: { role: 'Patient' } });

    // Status breakdowns aggregation
    const statusCounts = await Appointment.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status']
    });

    const statusObj = {
      Pending: 0,
      Approved: 0,
      Completed: 0,
      Cancelled: 0
    };

    statusCounts.forEach(item => {
      const data = item.toJSON();
      statusObj[data.status] = parseInt(data.count, 10);
    });

    // Average consult fees
    const feeMetrics = await Doctor.findAll({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('consultationFee')), 'avgFee'],
        [sequelize.fn('MAX', sequelize.col('consultationFee')), 'maxFee']
      ]
    });

    const avgFee = feeMetrics[0] ? parseFloat(feeMetrics[0].toJSON().avgFee || 0) : 0;
    const maxFee = feeMetrics[0] ? parseFloat(feeMetrics[0].toJSON().maxFee || 0) : 0;

    // Resolve recent notification dispatches logs
    const recentNotifications = await Notification.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['fullName', 'email']
        }
      ]
    });

    return {
      totals: {
        appointments: totalAppointments,
        doctors: totalDoctors,
        patients: totalPatients
      },
      appointmentsByStatus: statusObj,
      financials: {
        averageConsultationFee: parseFloat(avgFee.toFixed(2)),
        maximumConsultationFee: parseFloat(maxFee.toFixed(2))
      },
      recentNotificationLogs: recentNotifications.map(n => n.toJSON())
    };
  }
}

export default new AdminService();
