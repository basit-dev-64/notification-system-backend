import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { NotificationType } from '../schemas/notification.schema';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  recipients: string[]; // email, phone number, or push token list

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
