import { IsEnum, IsOptional, IsString, IsArray, IsNotEmpty, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';
import { NotificationType } from '../schemas/notification.schema';

export class UpdateNotificationDto {

  @IsMongoId()
  @IsNotEmpty()
  notificationId: Types.ObjectId;
  
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  recipients?: string[];

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  userId?: string;
}

