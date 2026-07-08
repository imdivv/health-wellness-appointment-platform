import cron from 'node-cron';
import { Op } from 'sequelize';
import Appointment from '../models/appointment.model.js';
import User from '../models/user.model.js';
import Doctor from '../models/doctor.model.js';
import Notification from '../models/notification.model.js';
import communicationService from './communication.service.js';

class ReminderService {
  /**
   * Initializes the automated background cron job scheduler.
   * Runs daily at 8:00 AM by default.
   */
  initializeCron() {
    // Cron schedule: "0 8 * * *" (Every day at 8:00 AM)
    // For local validation, you can change this to "*/5 * * * *" to trigger every 5 minutes
    cron.schedule('0 8 * * *', async () => {
      console.log('⏰ [CRON JOB] Starting automated daily appointment reminder task...');
      try {
        await this.sendUpcomingReminders();
        console.log('✔ [CRON JOB] Automated reminder task complete.');
      } catch (error) {
        console.error('❌ [CRON JOB] Automated reminder task failed:', error.message);
      }
    });

    console.log('✔ Reminder Cron Job Initialized (Daily at 8:00 AM)');
  }

  /**
   * Scans SQL Database for appointments happening tomorrow and dispatches reminders.
   */
  async sendUpcomingReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`🔍 Scanning for approved appointments scheduled for: ${tomorrowStr}`);

    const appointments = await Appointment.findAll({
      where: {
        appointmentDate: tomorrowStr,
        status: 'Approved'
      },
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'fullName', 'email', 'phone']
        },
        {
          model: Doctor,
          as: 'doctor',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['fullName']
            }
          ]
        }
      ]
    });

    console.log(`Found ${appointments.length} appointments scheduled for tomorrow.`);

    for (const appointment of appointments) {
      const patient = appointment.patient;
      const doctorName = appointment.doctor.user.fullName;
      const formattedTime = appointment.startTime.substring(0, 5);

      // 1. Dispatch Email Reminder
      const emailSubject = `Appointment Reminder: Tomorrow with Dr. ${doctorName}`;
      const emailText = `Hello ${patient.fullName},\n\nThis is a reminder that you have an appointment tomorrow with Dr. ${doctorName} starting at ${formattedTime}.\n\nIf you need to change or cancel this slot, please log into the portal.`;
      
      try {
        await communicationService.sendEmail(patient.email, emailSubject, emailText);
        await Notification.create({
          userId: patient.id,
          type: 'Email',
          recipient: patient.email,
          title: emailSubject,
          message: emailText,
          status: 'Sent',
          sentAt: new Date()
        });
      } catch (err) {
        console.error(`Failed to send email to ${patient.email}:`, err.message);
        await Notification.create({
          userId: patient.id,
          type: 'Email',
          recipient: patient.email,
          title: emailSubject,
          message: emailText,
          status: 'Failed'
        });
      }

      // 2. Dispatch SMS Reminder (only if phone is valid E.164)
      if (patient.phone && patient.phone.startsWith('+')) {
        const smsMessage = `Hi ${patient.fullName}, reminder: your appointment with Dr. ${doctorName} is tomorrow at ${formattedTime}.`;
        try {
          await communicationService.sendSMS(patient.phone, smsMessage);
          await Notification.create({
            userId: patient.id,
            type: 'SMS',
            recipient: patient.phone,
            title: 'Appointment Reminder',
            message: smsMessage,
            status: 'Sent',
            sentAt: new Date()
          });
        } catch (err) {
          console.error(`Failed to send SMS to ${patient.phone}:`, err.message);
          await Notification.create({
            userId: patient.id,
            type: 'SMS',
            recipient: patient.phone,
            title: 'Appointment Reminder',
            message: smsMessage,
            status: 'Failed'
          });
        }
      }
    }
  }
}

export default new ReminderService();
