import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { NotificationLogs, NotificationLogsSchema } from './schemas/notificationlogs.schema';
import { NotificationFactoryService } from './services/notification-factory.service';
import { EmailService } from './channels/email/email.service';
import { SmsService } from './channels/sms/sms.service';
import { PushService } from './channels/push/push.service';
import { JwtService } from 'src/services/jwt/jwt.service';
import { NotificationQueue } from '../../queues/notification.queue';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationLogs.name, schema: NotificationLogsSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationFactoryService,
    EmailService,
    SmsService,
    PushService,
    JwtService,
    NotificationQueue,
  ],
  exports: [NotificationsService], 
})
export class NotificationsModule {}

