import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsDate,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MethodEnum } from 'src/modules/system-logs/model/enum/method.enum';
import { CredentialRole } from 'src/modules/user/model/enum/role.enum';
import { ProfileRole } from 'src/modules/profile/model/enum/profile-role';
import { SubCredentialRole } from 'src/modules/user/model/enum/sub-role.enum';
import { Type } from 'class-transformer';

export class PaginationParams {
  @ApiProperty({
    type: Number,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  page: 1;

  @ApiProperty({
    type: Number,
    default: 10,
  })
  @IsNumber()
  @IsOptional()
  limit: 10;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  search: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  column: string;

  @ApiProperty({
    type: String,
    required: false,
    default: 'ASC',
  })
  @IsString()
  @IsOptional()
  order: 'ASC' | 'DESC';

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  status: '0' | '1';

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  profile: string;

  @ApiProperty({
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  partnerState: number;

  @ApiProperty({
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  idRegionalPartner: number;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  city: string;

  @ApiProperty({
    enum: CredentialRole,
    required: false,
  })
  @IsEnum(CredentialRole)
  @IsOptional()
  role: CredentialRole;

  @ApiProperty({
    enum: SubCredentialRole,
    required: false,
  })
  @IsEnum(SubCredentialRole)
  @IsOptional()
  profileType: SubCredentialRole;

  @ApiProperty({
    enum: ProfileRole,
    required: false,
  })
  @IsEnum(ProfileRole)
  @IsOptional()
  accessProfileRole: ProfileRole;

  @ApiProperty({
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  forApproveScholar: boolean;
}

export class PaginationParamsLogs {
  @ApiProperty({
    type: Number,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  page: 1;

  @ApiProperty({
    type: Number,
    default: 10,
  })
  @IsNumber()
  @IsOptional()
  limit: 10;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  search: string;

  @ApiProperty({
    type: String,
    required: false,
    default: 'ASC',
  })
  @IsString()
  @IsOptional()
  order: 'ASC' | 'DESC';

  @ApiProperty({
    enum: MethodEnum,
    required: false,
  })
  @IsEnum(MethodEnum)
  @IsOptional()
  method: MethodEnum;

  @ApiProperty({
    enum: CredentialRole,
    required: false,
  })
  @IsEnum(CredentialRole)
  @IsOptional()
  origin: CredentialRole;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  column: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  entity: string;

  @ApiProperty({
    type: Date,
    required: false,
  })
  @IsDate()
  @IsOptional()
  initialDate: Date;

  @ApiProperty({
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  regionalPartnerId: number;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  city: string;

  @ApiProperty({
    type: Date,
    required: false,
  })
  @IsDate()
  @IsOptional()
  finalDate: Date;
}
