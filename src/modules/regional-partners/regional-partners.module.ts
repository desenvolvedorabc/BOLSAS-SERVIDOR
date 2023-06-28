import { Module } from '@nestjs/common';
import { RegionalPartnersService } from './regional-partners.service';
import { RegionalPartnersController } from './regional-partners.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegionalPartnersRepository } from './repositories/regional-partners-repository';

@Module({
  imports: [TypeOrmModule.forFeature([RegionalPartnersRepository])],
  controllers: [RegionalPartnersController],
  providers: [RegionalPartnersService],
  exports: [RegionalPartnersService],
})
export class RegionalPartnersModule {}
