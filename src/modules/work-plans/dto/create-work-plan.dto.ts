import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateScheduleWorkPlanDto } from './create-schedule-work-plan.dto';

export class CreateWorkPlanDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(3000)
  justification: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(3000)
  generalObjectives: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(3000)
  specificObjectives: string;

  @ApiProperty({
    isArray: true,
    type: CreateScheduleWorkPlanDto,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateScheduleWorkPlanDto)
  @ArrayMinSize(1)
  schedules: CreateScheduleWorkPlanDto[];
}
