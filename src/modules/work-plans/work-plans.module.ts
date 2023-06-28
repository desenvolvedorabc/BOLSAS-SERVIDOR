import { Module } from '@nestjs/common';
import { WorkPlansController } from './work-plans.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleWorkPlan } from './entities/schedule-work-plan.entity';
import { WorkPlansRepository } from './repositories/work-plans.repository';
import { WorkPlansService } from './services/work-plans.service';
import { SchedulesWorkPlanService } from './services/schedules-work-plan.service';
import { TermsOfMembershipModule } from '../terms-of-membership/terms-of-membership.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduleWorkPlan, WorkPlansRepository]),
    TermsOfMembershipModule,
  ],
  controllers: [WorkPlansController],
  providers: [WorkPlansService, SchedulesWorkPlanService],
  exports: [WorkPlansService],
})
export class WorkPlansModule {}
