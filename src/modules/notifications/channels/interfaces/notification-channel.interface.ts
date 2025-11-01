import { Notification } from '../../schemas/notification.schema';

export interface SendNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface INotificationChannel {
  send(notification: Notification): Promise<SendNotificationResult>;
}

