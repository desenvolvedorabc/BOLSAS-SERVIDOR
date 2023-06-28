import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../user/model/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, User]), NotificationsModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
