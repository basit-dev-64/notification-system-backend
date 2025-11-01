import { IsISO8601, IsOptional, IsMongoId, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class SendNotificationDto {
  @IsMongoId()
  @IsNotEmpty()
  notificationId: Types.ObjectId;

  @IsISO8601()
  @IsOptional()
  scheduledAt?: string; // ISO 8601 format
}

