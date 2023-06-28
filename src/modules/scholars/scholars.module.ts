import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/model/entities/user.entity';
import { UserModule } from '../user/user.module';
import { Scholar } from './entities/scholar.entity';
import { ScholarsController } from './scholars.controller';
import { ScholarsService } from './scholars.service';
import { ValidationHistory } from 'src/shared/entities/validation-history.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([Scholar, ValidationHistory]),
    NotificationsModule,
  ],
  controllers: [ScholarsController],
  providers: [ScholarsService],
  exports: [ScholarsService],
})
export class ScholarsModule {}
