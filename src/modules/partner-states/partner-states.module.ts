import { Module } from '@nestjs/common';
import { PartnerStatesService } from './partner-states.service';
import { PartnerStatesController } from './partner-states.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartnerState } from './entities/partner-state.entity';
import { TypeormPartnerStatesRepository } from './repositories/typeorm/typeorm-partner-states-repository';
import { PartnerStatesRepository } from './repositories/partner-states-repository';

@Module({
  imports: [TypeOrmModule.forFeature([PartnerState])],
  controllers: [PartnerStatesController],
  providers: [
    PartnerStatesService,
    {
      provide: PartnerStatesRepository,
      useClass: TypeormPartnerStatesRepository,
    },
  ],
  exports: [PartnerStatesService],
})
export class PartnerStatesModule {}
