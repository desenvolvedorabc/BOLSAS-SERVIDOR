import { PartialType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CreatePartnerStateDto } from './create-partner-state.dto';

export class UpdatePartnerStateDto extends PartialType(CreatePartnerStateDto) {
  @IsOptional()
  active?: boolean;
}
