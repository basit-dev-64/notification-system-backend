import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Request, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { AuthGuard } from '../../middlewares/auth.guard';
import { NotificationStatus } from './schemas/notificationlogs.schema';

@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateNotificationDto, @Request() req: { user?: { id?: string } }) {
    return this.notificationsService.create(createDto, req.user?.id);
  }

  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  send(@Body() sendDto: SendNotificationDto, @Request() req: { user?: { id?: string } }) {
    return this.notificationsService.send(sendDto, req.user?.id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Request() req: { user?: { id?: string } }) {
    return this.notificationsService.findAll(req.user?.id);
  }

  @Get('logs')
  @HttpCode(HttpStatus.OK)
  getNotificationLogs(@Query('type') type: NotificationStatus) {
    return this.notificationsService.getNotificationLogs(type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateNotificationDto) {
    return this.notificationsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.notificationsService.delete(id);
  }
}
