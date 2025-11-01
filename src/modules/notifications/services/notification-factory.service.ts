import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '../schemas/notification.schema';
import { EmailService } from '../channels/email/email.service';
import { SmsService } from '../channels/sms/sms.service';
import { PushService } from '../channels/push/push.service';
import { INotificationChannel } from '../channels/interfaces/notification-channel.interface';

@Injectable()
export class NotificationFactoryService {
  private readonly logger = new Logger(NotificationFactoryService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly pushService: PushService,
  ) {}

  getChannel(type: NotificationType): INotificationChannel {
    switch (type) {
      case NotificationType.EMAIL:
        return this.emailService;
      case NotificationType.SMS:
        return this.smsService;
      case NotificationType.PUSH:
        return this.pushService;
      default:
        this.logger.error(`Unsupported notification type: ${type}`);
        throw new Error(`Unsupported notification type: ${type}`);
    }
  }
}

