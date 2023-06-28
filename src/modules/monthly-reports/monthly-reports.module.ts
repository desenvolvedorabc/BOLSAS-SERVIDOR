import { Module } from '@nestjs/common';
import { MonthlyReportsService } from './monthly-reports.service';
import { MonthlyReportsController } from './monthly-reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonthlyReport } from './entities/monthly-report.entity';
import { ActionMonthlyReport } from './entities/action-monthly-report.entity';
import { ScholarsModule } from '../scholars/scholars.module';
import { WorkPlansModule } from '../work-plans/work-plans.module';
import { ScheduleWorkPlan } from '../work-plans/entities/schedule-work-plan.entity';
import { ValidationHistory } from 'src/shared/entities/validation-history.entity';
import { SystemParametersModule } from '../system-parameters/system-parameters.module';
import { TermsOfMembershipModule } from '../terms-of-membership/terms-of-membership.module';
import { BankRemittancesModule } from '../bank-remittances/bank-remittances.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MonthlyReport,
      ActionMonthlyReport,
      ScheduleWorkPlan,
      ValidationHistory,
    ]),
    ScholarsModule,
    WorkPlansModule,
    BankRemittancesModule,
    SystemParametersModule,
    TermsOfMembershipModule,
    NotificationsModule,
  ],
  controllers: [MonthlyReportsController],
  providers: [MonthlyReportsService],
  exports: [MonthlyReportsService],
})
export class MonthlyReportsModule {}
