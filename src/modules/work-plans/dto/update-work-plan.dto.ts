import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateWorkPlanDto } from './create-work-plan.dto';

export class UpdateWorkPlanDto extends OmitType(
  PartialType(CreateWorkPlanDto),
  ['schedules'],
) {}
