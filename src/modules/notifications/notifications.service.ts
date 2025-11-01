import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument,  NotificationType } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationFactoryService } from './services/notification-factory.service';
import { NotificationLogs, NotificationLogsDocument, NotificationStatus } from './schemas/notificationlogs.schema';
import { NotificationQueue } from '../../queues/notification.queue';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationLogs.name) private readonly notificationLogsModel: Model<NotificationLogsDocument>,
    private readonly notificationFactory: NotificationFactoryService,
    private readonly notificationQueue: NotificationQueue,
  ) {}

  async create(createDto: CreateNotificationDto, userId?: string): Promise<Notification> {
    try {
      return await this.notificationModel.create({...createDto, userId});
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`);
      throw new HttpException('Failed to create notification', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(userId?: string): Promise<Notification[]> {
    const query = userId ? { userId } : {};
    return await this.notificationModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Notification> {
    let notificationId = new Types.ObjectId(id);
    const notification = await this.notificationModel.findById(notificationId);
    if (!notification) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }
    return notification;
  }

  async update(id: string, updateDto: UpdateNotificationDto): Promise<Notification> {
    let notificationId = new Types.ObjectId(id);
    const notification = await this.notificationModel.findByIdAndUpdate(notificationId, updateDto, { new: true });
    if (!notification) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }
    return notification;
  }

  async delete(id: string): Promise<void> {
    let notificationId = new Types.ObjectId(id);
    const result = await this.notificationModel.deleteOne({ _id: notificationId });
    if (result.deletedCount === 0) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }
  }

  async send(sendDto: SendNotificationDto, senderId?: string): Promise<NotificationLogs> {
    const { notificationId } = sendDto;
    let notificationIdObject = new Types.ObjectId(notificationId);
    const notification = await this.notificationModel.findById(notificationIdObject);
    if (!notification) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }
    if (sendDto.scheduledAt) {
      const senderObjectId = senderId ? new Types.ObjectId(senderId) : undefined;
      return await this.scheduleNotification(notification._id, new Date(sendDto.scheduledAt), senderObjectId);
    } else {
      return await this.sendNotification(notification, senderId);
    }
  }

  async sendNotification(notification: Notification, senderId?: string): Promise<NotificationLogs> {
    try {
      const channel = this.notificationFactory.getChannel(notification.type);
      const result = await channel.send(notification);

      const senderObjectId = senderId ? new Types.ObjectId(senderId) : undefined;

      if (result.success) {
        const notificationLog = await this.notificationLogsModel.create({
          notificationId: notification._id,
          status: NotificationStatus.SENT,
          sentAt: new Date(),
          messageId: result.messageId,
          senderId: senderObjectId,
        });
        return notificationLog;
      } else {
        const notificationLog = await this.notificationLogsModel.create({
          notificationId: notification._id,
          status: NotificationStatus.FAILED,
          errorMessage: result.error,
          senderId: senderObjectId,
        });
        return notificationLog;
      }
    } catch (error) {
      this.logger.error(`Failed to send notification ${(notification as any)._id}: ${error.message}`);
      throw new HttpException(`Failed to send notification: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async scheduleNotification(notificationId: Types.ObjectId, scheduledAt: Date , senderId?: Types.ObjectId): Promise<NotificationLogs> {
    if (scheduledAt < new Date()) {
      throw new HttpException('Scheduled time is in the past', HttpStatus.BAD_REQUEST);
    }

    // Create notification log with SCHEDULED status
    const notificationLog = await this.notificationLogsModel.create({ 
      notificationId, 
      status: NotificationStatus.SCHEDULED, 
      scheduledAt, 
      senderId 
    });

    // Add job to BullMQ queue with delay
    try {
      const jobId = await this.notificationQueue.addScheduledNotification(
        notificationLog._id.toString(),
        scheduledAt,
        senderId?.toString(),
      );
      
      this.logger.log(
        `Notification ${notificationId} scheduled for ${scheduledAt.toISOString()}. Job ID: ${jobId}`,
      );
      
      // Store job ID in the log for potential cancellation
      notificationLog.jobId = jobId;
      await notificationLog.save();
    } catch (error) {
      this.logger.error(`Failed to schedule notification in queue: ${error.message}`);
      // Update log status to FAILED if queue operation fails
      notificationLog.status = NotificationStatus.FAILED;
      notificationLog.errorMessage = `Failed to schedule: ${error.message}`;
      await notificationLog.save();
      throw new HttpException('Failed to schedule notification', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return notificationLog;
  }

  async getNotificationLogs(type: NotificationStatus): Promise<NotificationLogs[]> {
    let query = {};
    if (type){
      query = { status: type };
    }
    return await this.notificationLogsModel.find(query).sort({ createdAt: -1 }).lean();
  }

}


