import { ApiProperty, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaginationParams } from 'src/helpers/params';
import { MonthlyReportStatus } from '../enum/monthly-report-status.enum';

export class PaginationParamsMonthlyReports extends PickType(PaginationParams, [
  'limit',
  'page',
  'order',
  'column',
  'search',
]) {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  month?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiProperty({
    enum: MonthlyReportStatus,
    required: false,
  })
  @IsEnum(MonthlyReportStatus)
  @IsOptional()
  status?: MonthlyReportStatus;
}
