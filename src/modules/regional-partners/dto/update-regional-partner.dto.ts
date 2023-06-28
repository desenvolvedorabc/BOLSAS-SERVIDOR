import { PartialType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CreateRegionalPartnerDto } from './create-regional-partner.dto';

export class UpdateRegionalPartnerDto extends PartialType(
  CreateRegionalPartnerDto,
) {
  @IsOptional()
  active?: boolean;
}
