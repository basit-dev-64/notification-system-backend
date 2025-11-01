import { Injectable, Logger } from '@nestjs/common';
import { INotificationChannel, SendNotificationResult } from '../interfaces/notification-channel.interface';
import { Notification } from '../../schemas/notification.schema';

@Injectable()
export class EmailService implements INotificationChannel {
  private readonly logger = new Logger(EmailService.name);

  async send(
    notification: Notification,
  ): Promise<SendNotificationResult> {
    try {
      this.logger.log(`Sending email to ${notification.recipients.join(', ')}`);

      // TODO: Integrate with your email provider (SendGrid, AWS SES, Mailgun, etc.)
      // Example with SendGrid:
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      // const msg = {
      //   to: recipient,
      //   from: process.env.FROM_EMAIL,
      //   subject: subject,
      //   html: content.html || content.body,
      // };
      // const response = await sgMail.send(msg);

      // Mock implementation for now
      const response = await this.simulateEmailSend(notification.recipients, notification.subject, notification.message);

      return {
        success: response.status,
        messageId: response.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async simulateEmailSend(recipients: string[], subject: string, message: string): Promise<{status: boolean, messageId: string}> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.logger.log(`Email sent: ${subject} to ${recipients.join(', ')}`);
    return {status: true, messageId: `email_${Date.now()}`};
  }
}

