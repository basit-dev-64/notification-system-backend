import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument ,Types} from 'mongoose';

export type NotificationLogsDocument = HydratedDocument<NotificationLogs>;

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  SCHEDULED = 'scheduled',
}

@Schema({ timestamps: true, collection: 'notificationlogs' })
export class NotificationLogs {
    
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  notificationId: Types.ObjectId;

  @Prop({ enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Prop({ type: Date })
  scheduledAt?: Date;

  @Prop({type: Date})
  sentAt?: Date;

  @Prop({ type: String, required: false })
  messageId?: string;

  @Prop({ type: String, required: false })
  errorMessage?: string;

  @Prop({ type: Types.ObjectId, required: false })
  senderId?: Types.ObjectId;

  @Prop({ type: String, required: false })
  jobId?: string; // BullMQ job ID for cancellation
}

export const NotificationLogsSchema = SchemaFactory.createForClass(NotificationLogs);

