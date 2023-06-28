import { Module } from '@nestjs/common';
import { UserService } from './service/user.service';
import { UserController } from './controller/user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForgetPassword } from './model/entities/forget-password.entity';
import { PartnerStatesModule } from '../partner-states/partner-states.module';
import { UserRepository } from './repositories/user-repository';
import { User } from './model/entities/user.entity';
import { RegionalPartnersModule } from '../regional-partners/regional-partners.module';
import { UsersStateService } from './service/user-state.service';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserRepository, User, ForgetPassword]),
    PartnerStatesModule,
    ProfileModule,
    RegionalPartnersModule,
  ],
  providers: [UserService, UsersStateService],
  controllers: [UserController],
  exports: [UserService, UsersStateService],
})
export class UserModule {}
