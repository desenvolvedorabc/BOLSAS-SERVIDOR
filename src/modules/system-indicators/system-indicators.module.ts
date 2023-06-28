import { Module } from '@nestjs/common';
import { SystemIndicatorsController } from './system-indicators.controller';
import { SystemIndicatorsParcService } from './services/system-indicators-parc.service';
import { SystemIndicatorsStateService } from './services/system-indicators-state.service';
import { MonthlyReportsModule } from '../monthly-reports/monthly-reports.module';

@Module({
  imports: [MonthlyReportsModule],
  controllers: [SystemIndicatorsController],
  providers: [SystemIndicatorsParcService, SystemIndicatorsStateService],
})
export class SystemIndicatorsModule {}
