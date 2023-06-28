import { OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CreateUserStateDto } from './create-user-state';

export class UpdateUserStateDto extends PartialType(
  OmitType(CreateUserStateDto, ['idPartnerState']),
) {
  @IsOptional()
  active?: boolean;
}
