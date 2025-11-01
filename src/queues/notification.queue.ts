import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, QueueOptions } from 'bullmq';
import configuration from '../configurations/configuration';

export interface NotificationJobData {
  notificationLogId: string;
  senderId?: string;
  scheduledAt: Date;
}

@Injectable()
export class NotificationQueue implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationQueue.name);
  public queue: Queue<NotificationJobData>;

  constructor() {
    const redisConfig = configuration().redis;
    
    // Support for Upstash Redis (requires TLS) and local Redis
    const useTLS = process.env.REDIS_USE_TLS === 'true' || redisConfig.host.includes('upstash.io');
    
    const connection: QueueOptions['connection'] = {
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

    this.queue = new Queue<NotificationJobData>('notification-queue', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000, // Keep max 1000 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    });
  }

  async onModuleInit() {
    this.logger.log('Notification queue initialized');
  }

  async onModuleDestroy() {
    await this.queue.close();
    this.logger.log('Notification queue closed');
  }

  async addScheduledNotification(
    notificationLogId: string,
    scheduledAt: Date,
    senderId?: string,
  ): Promise<string> {
    const delay = scheduledAt.getTime() - Date.now();

    if (delay <= 0) {
      throw new Error('Scheduled time must be in the future');
    }

    const job = await this.queue.add(
      'send-notification',
      {
        notificationLogId,
        senderId,
        scheduledAt,
      },
      {
        delay, // BullMQ will delay the job execution
        jobId: `notification-${notificationLogId}-${scheduledAt.getTime()}`, // Unique job ID
      },
    );

    this.logger.log(
      `Scheduled notification ${notificationLogId} to be sent at ${scheduledAt.toISOString()}. Job ID: ${job.id}`,
    );

    return job.id!;
  }

  async removeScheduledNotification(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);
    if (job) {
      await job.remove();
      this.logger.log(`Removed scheduled notification job ${jobId}`);
    }
  }

  async getJob(jobId: string) {
    return await this.queue.getJob(jobId);
  }
}

