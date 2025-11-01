import * as dotenv from 'dotenv';
dotenv.config();

import { Worker, WorkerOptions } from 'bullmq';
import { Logger } from '@nestjs/common';
import * as mongoose from 'mongoose';
import configuration from '../configurations/configuration';
import { Notification, NotificationSchema } from '../modules/notifications/schemas/notification.schema';
import { NotificationLogs, NotificationLogsSchema, NotificationStatus } from '../modules/notifications/schemas/notificationlogs.schema';
import { NotificationJobData } from '../queues/notification.queue';
import { NotificationFactoryService } from '../modules/notifications/services/notification-factory.service';
import { EmailService } from '../modules/notifications/channels/email/email.service';
import { SmsService } from '../modules/notifications/channels/sms/sms.service';
import { PushService } from '../modules/notifications/channels/push/push.service';

const logger = new Logger('NotificationWorker');

class NotificationWorkerService {
  private worker: Worker<NotificationJobData>;
  private notificationModel: mongoose.Model<Notification>;
  private notificationLogsModel: mongoose.Model<NotificationLogs>;
  private notificationFactory: NotificationFactoryService;

  constructor() {
    this.initializeDatabase();
    this.initializeServices();
    this.initializeWorker();
  }

  private async initializeDatabase() {
    const mongoUri = configuration().mongoUri;
    try {
      await mongoose.connect(mongoUri as string);
      logger.log('Connected to MongoDB');

      // Initialize models
      this.notificationModel = mongoose.model(Notification.name, NotificationSchema);
      this.notificationLogsModel = mongoose.model(NotificationLogs.name, NotificationLogsSchema);
    } catch (error) {
      logger.error(`Failed to connect to MongoDB: ${error.message}`);
      process.exit(1);
    }
  }

  private initializeServices() {
    const emailService = new EmailService();
    const smsService = new SmsService();
    const pushService = new PushService();
    this.notificationFactory = new NotificationFactoryService(
      emailService,
      smsService,
      pushService,
    );
  }

  private initializeWorker() {
    const redisConfig = configuration().redis;
    
    // Support for Upstash Redis (requires TLS) and local Redis
    const useTLS = process.env.REDIS_USE_TLS === 'true' || redisConfig.host.includes('upstash.io');
    
    const connection: WorkerOptions['connection'] = {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      maxRetriesPerRequest: null,
      connectTimeout: 30000, // 30 seconds for connection attempts
      commandTimeout: 30000, // 30 seconds for command execution
      ...(useTLS && {
        tls: {},
      }),
    };

    this.worker = new Worker<NotificationJobData>(
      'notification-queue',
      async (job) => {
        await this.processNotification(job.data);
      },
      {
        connection,
        concurrency: 5, // Process up to 5 jobs concurrently
        limiter: {
          max: 100, // Max 100 jobs
          duration: 1000, // Per 1 second (rate limiting)
        },
      },
    );

    this.setupEventHandlers();
    logger.log('Notification worker started and listening for jobs');
  }

  private setupEventHandlers() {
    this.worker.on('completed', (job) => {
      logger.log(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed: ${err.message}`);
    });

    this.worker.on('error', (err) => {
      logger.error(`Worker error: ${err.message}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.log('SIGTERM received, closing worker gracefully');
      await this.worker.close();
      await mongoose.connection.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.log('SIGINT received, closing worker gracefully');
      await this.worker.close();
      await mongoose.connection.close();
      process.exit(0);
    });
  }

  private async processNotification(data: NotificationJobData) {
    const { notificationLogId, senderId } = data;
    
    try {
      logger.log(`Processing scheduled notification log: ${notificationLogId}`);

      // Find the notification log
      let notificationLogIdObject = new mongoose.Types.ObjectId(notificationLogId);
      const notificationLog = await this.notificationLogsModel.findById(notificationLogIdObject);
      if (!notificationLog) {
        throw new Error(`Notification log ${notificationLogId} not found`);
      }

      // Verify the log is still in SCHEDULED status
      if (notificationLog.status !== NotificationStatus.SCHEDULED) {
        logger.warn(`Notification log ${notificationLogId} is not in SCHEDULED status (current: ${notificationLog.status}). Skipping.`);
        return;
      }

      // Find the notification
      const notification = await this.notificationModel.findById(notificationLog.notificationId);
      if (!notification) {
        throw new Error(`Notification ${notificationLog.notificationId} not found`);
      }

      // Update log status to PENDING before sending
      notificationLog.status = NotificationStatus.PENDING;
      await notificationLog.save();

      // Send the notification
      const channel = this.notificationFactory.getChannel(notification.type);
      const result = await channel.send(notification);

      if (result.success) {
        // Update log to SENT
        notificationLog.status = NotificationStatus.SENT;
        notificationLog.sentAt = new Date();
        notificationLog.messageId = result.messageId;
        await notificationLog.save();
        logger.log(`Notification ${notification._id} sent successfully (log: ${notificationLogId})`);
      } else {
        // Update log to FAILED
        notificationLog.status = NotificationStatus.FAILED;
        notificationLog.errorMessage = result.error;
        await notificationLog.save();
        logger.error(`Notification ${notification._id} failed: ${result.error} (log: ${notificationLogId})`);
        throw new Error(result.error || 'Failed to send notification');
      }
    } catch (error) {
      logger.error(`Error processing notification log ${notificationLogId}: ${error.message}`);
      
      // Update log to FAILED if it exists
      try {
        const notificationLog = await this.notificationLogsModel.findById(notificationLogId);
        if (notificationLog) {
          notificationLog.status = NotificationStatus.FAILED;
          notificationLog.errorMessage = error.message;
          await notificationLog.save();
        }
      } catch (updateError) {
        logger.error(`Failed to update notification log: ${updateError.message}`);
      }

      throw error; // Re-throw to mark job as failed
    }
  }
}

// Start the worker
const workerService = new NotificationWorkerService();

