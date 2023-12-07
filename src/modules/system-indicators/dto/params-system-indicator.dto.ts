import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { MonthlyReportStatus } from 'src/modules/monthly-reports/enum/monthly-report-status.enum';

export class ParamsSystemIndicatorDto {
  @ApiProperty({
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  year: number;

  @ApiProperty({
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  month: number;

  @ApiProperty({
    enum: MonthlyReportStatus,
    required: false,
  })
  @IsEnum(MonthlyReportStatus)
  @IsOptional()
  status?: MonthlyReportStatus;

  @ApiProperty({
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  partnerStateId: number;

  @ApiProperty({
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  regionalPartnerId: number;

  @ApiProperty({
    required: false,
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  cities: string[];

  @ApiProperty({
    type: Date,
    required: false,
  })
  @IsDate()
  @IsOptional()
  initialDate: Date;

  @ApiProperty({
    type: Date,
    required: false,
  })
  @IsDate()
  @IsOptional()
  finalDate: Date;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsInt({ each: true })
  @IsArray()
  partnerStateIds: number[];

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsInt({ each: true })
  @IsArray()
  regionalPartnerIds: number[];

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsInt({ each: true })
  @IsArray()
  months: number[];

}
