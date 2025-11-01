import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;
  @Prop({ required: true, enum: NotificationType })
  type: NotificationType;

  @Prop({ required: true, type: [String] })
  recipients: string []; // email, phone number, or push token list

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  message:string;

  @Prop({ type: String, required: false })
  userId?: string; 
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

