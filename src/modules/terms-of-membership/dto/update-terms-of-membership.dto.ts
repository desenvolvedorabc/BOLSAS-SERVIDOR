import { PartialType } from '@nestjs/swagger';
import { CreateTermsOfMembershipDto } from './create-terms-of-membership.dto';

export class UpdateTermsOfMembershipDto extends PartialType(
  CreateTermsOfMembershipDto,
) {}
