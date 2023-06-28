import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileController } from './controller/profile.controller';
import { AccessProfileRepository } from './repositories/access-profile-repository';
import { AreaProfileRepository } from './repositories/area-profile-repository';
import { ProfileService } from './service/profile.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccessProfileRepository, AreaProfileRepository]),
  ],
  providers: [ProfileService],
  controllers: [ProfileController],
  exports: [ProfileService],
})
export class ProfileModule {}
