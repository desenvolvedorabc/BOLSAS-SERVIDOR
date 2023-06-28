import { PartialType } from '@nestjs/swagger';
import { CreateCompletedScholarDto } from './create-completed-scholar.dto';

export class UpdateCompletedScholarDto extends PartialType(
  CreateCompletedScholarDto,
) {}
