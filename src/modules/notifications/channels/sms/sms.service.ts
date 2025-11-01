import { Injectable, Logger } from '@nestjs/common';
import { INotificationChannel, SendNotificationResult } from '../interfaces/notification-channel.interface';
import { Notification } from '../../schemas/notification.schema';

@Injectable()
export class SmsService implements INotificationChannel {
  private readonly logger = new Logger(SmsService.name);

  async send(notification: Notification): Promise<SendNotificationResult> {
    try {
      this.logger.log(`Sending SMS to ${notification.recipients.join(', ')}`);

      // TODO: Integrate with your SMS provider (Twilio, AWS SNS, Vonage, etc.)
      // Example with Twilio:
      // const twilio = require('twilio');
      // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      // const message = await client.messages.create({
      //   body: notification.message,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: notification.recipients[0],
      // });

      // Mock implementation for now
      const response = await this.simulateSmsSend(notification.recipients, notification.message);

      return {
        success: response.status,
        messageId: response.messageId,
        metadata: { provider: 'sms' },
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async simulateSmsSend(recipients: string[], message: string): Promise<{status: boolean, messageId: string}> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.logger.log(`SMS sent to ${recipients.join(', ')}: ${message}`);
    return {status: true, messageId: `sms_${Date.now()}`};
  }
}

