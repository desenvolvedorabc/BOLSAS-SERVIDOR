import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationParams } from 'src/helpers/params';
import { TermOfMembershipStatus } from '../enum/status-term-membership.enum';

export class PaginationTermsOfMembership extends PickType(PaginationParams, [
  'limit',
  'page',
  'order',
  'column',
  'search',
  'city',
]) {
  @ApiProperty({
    enum: TermOfMembershipStatus,
    required: false,
  })
  @IsEnum(TermOfMembershipStatus)
  @IsOptional()
  status?: TermOfMembershipStatus;
}
