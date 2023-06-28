import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { PaginationParams } from 'src/helpers/params';
import { WorkPlanStatus } from '../enum/work-plan-status.enum';

export class PaginationParamsWorkPlans extends PickType(PaginationParams, [
  'limit',
  'page',
  'order',
  'column',
  'search',
]) {
  @ApiProperty({
    enum: WorkPlanStatus,
    required: false,
  })
  @IsEnum(WorkPlanStatus)
  @IsOptional()
  status?: WorkPlanStatus;

  @ApiProperty({
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  referenceYear?: number;
}
