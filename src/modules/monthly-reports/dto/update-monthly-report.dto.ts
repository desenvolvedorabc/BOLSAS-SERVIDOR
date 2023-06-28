import { PartialType } from '@nestjs/swagger';
import { CreateMonthlyReportDto } from './create-monthly-report.dto';

export class UpdateMonthlyReportDto extends PartialType(
  CreateMonthlyReportDto,
) {}
