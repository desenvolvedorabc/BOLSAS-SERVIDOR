import { PartialType } from '@nestjs/swagger';
import { CreateScheduleWorkPlanDto } from './create-schedule-work-plan.dto';

export class UpdateScheduleWorkPlanDto extends PartialType(
  CreateScheduleWorkPlanDto,
) {}
