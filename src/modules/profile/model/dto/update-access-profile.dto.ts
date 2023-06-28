import { PartialType } from '@nestjs/mapped-types';
import { IsOptional } from 'class-validator';
import { CreateAccessProfileDto } from './create-access-profile.dto';

export class UpdateAccessProfileDto extends PartialType(
  CreateAccessProfileDto,
) {
  @IsOptional()
  active?: boolean;
}
