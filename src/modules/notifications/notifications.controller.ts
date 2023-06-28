import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { PaginationParams } from 'src/helpers/params';
import { GetUser } from '../auth/decorator/current-user.decorator';
import { User } from '../user/model/entities/user.entity';
import { Notification } from './entities/notification.entity';

@Controller('notifications')
@ApiTags('Notificações')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@Query() paginationParams: PaginationParams, @GetUser() user: User) {
    return this.notificationsService.findAll(paginationParams, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<{
    notification: Notification;
  }> {
    return this.notificationsService.findOne(+id);
  }

  @Patch(':id/read')
  read(@Param('id') id: string): Promise<void> {
    return this.notificationsService.read(+id);
  }
}
