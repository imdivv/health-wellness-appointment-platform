import { EmailClient } from '@azure/communication-email';
import { SmsClient } from '@azure/communication-sms';
import { env } from '../config/env.js';

let emailClient;
let smsClient;
let isMock = false;

const connStr = env.azure.communicationConnectionString;

// Resilient initialization: Fall back to local mock notification simulation if credentials are missing
if (!connStr || connStr.includes('your_') || connStr === 'endpoint=https://localhost;accesskey=secret') {
  console.warn('⚠️ Warning: Azure Communication Services connection string is missing or set to placeholder. Using mock simulation.');
  isMock = true;
} else {
  try {
    emailClient = new EmailClient(connStr);
    smsClient = new SmsClient(connStr);
  } catch (error) {
    console.error('❌ Failed to initialize Azure Communication Services Clients:', error.message);
    isMock = true;
  }
}

class CommunicationService {
  /**
   * Dispatches an email via Azure Communication Services Email Client.
   * @param {string} toEmail - Recipient email address
   * @param {string} subject - Email subject title
   * @param {string} textContent - Plain text email content
   * @param {string} htmlContent - HTML formatted email content (optional)
   * @returns {Promise<Object>} Send poll results
   */
  async sendEmail(toEmail, subject, textContent, htmlContent) {
    if (isMock) {
      console.log(`[MOCK EMAIL] To: ${toEmail} | Subject: ${subject}`);
      console.log(`[MOCK EMAIL] PlainBody: ${textContent}`);
      return { messageId: `mock-email-id-${Date.now()}` };
    }

    try {
      const emailMessage = {
        // Azure Communication Services requires sending from a verified custom domain sender address
        senderAddress: "DoNotReply@yourverifieddomain.azurecomm.net",
        content: {
          subject: subject,
          plainText: textContent,
          html: htmlContent || `<p>${textContent}</p>`
        },
        recipients: {
          to: [{ address: toEmail }]
        }
      };

      const poller = await emailClient.beginSend(emailMessage);
      const result = await poller.pollUntilDone();
      return result;
    } catch (error) {
      console.error('❌ Azure Email service failure:', error.message);
      throw error;
    }
  }

  /**
   * Dispatches a text message via Azure Communication Services SMS Client.
   * @param {string} toPhone - Recipient phone number in E.164 format
   * @param {string} messageText - SMS text message body
   * @returns {Promise<Object>} Send result
   */
  async sendSMS(toPhone, messageText) {
    if (isMock) {
      console.log(`[MOCK SMS] To: ${toPhone} | Message: ${messageText}`);
      return { messageId: `mock-sms-id-${Date.now()}` };
    }

    try {
      // Azure Communication Services requires sending from a purchased toll-free or shortcode number
      const sendResult = await smsClient.send({
        from: "+18885550199", // Replace with acquired ACS number
        to: [toPhone],
        message: messageText
      });

      return sendResult[0];
    } catch (error) {
      console.error('❌ Azure SMS service failure:', error.message);
      throw error;
    }
  }
}

export default new CommunicationService();
