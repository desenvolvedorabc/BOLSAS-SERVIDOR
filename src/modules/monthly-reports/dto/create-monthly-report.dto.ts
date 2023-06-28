import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { StatusActionMonthlyEnum } from '../enum/status-action-monthly.enum';
import { TrainingModalityEnum } from '../enum/training-modality.enum';

class CreateActionMonthlyReportDto {
  @ApiProperty()
  @IsNotEmpty({
    message: 'Informe o ID do mês do plano de trabalho',
  })
  @Type(() => Number)
  @IsInt()
  scheduleWorkPlanId: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  detailing: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  detailingResult: string;

  @ApiProperty()
  @IsOptional()
  @IsDate()
  trainingDate: Date;

  @ApiProperty()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  workloadInMinutes: number;

  @ApiProperty()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  qntExpectedGraduates: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  qntFormedGifts: number;

  @IsOptional()
  @ApiProperty()
  @IsEnum(TrainingModalityEnum)
  trainingModality: TrainingModalityEnum;

  @IsNotEmpty({
    message: 'Informe o status da ação do plano de trabalho.',
  })
  @ApiProperty({
    enum: StatusActionMonthlyEnum,
  })
  @IsEnum(StatusActionMonthlyEnum)
  status: StatusActionMonthlyEnum;
}

export class CreateMonthlyReportDto {
  @IsNotEmpty({
    message: 'Informe o mês do relatório',
  })
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsNotEmpty({
    message: 'Informe o ano do relatório',
  })
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  year: number;

  @ApiProperty({
    isArray: true,
    type: CreateActionMonthlyReportDto,
  })
  @ApiProperty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateActionMonthlyReportDto)
  @ArrayMinSize(1)
  actions: CreateActionMonthlyReportDto[];
}
