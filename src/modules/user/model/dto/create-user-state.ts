import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { SubCredentialRole } from '../enum/sub-role.enum';
import { CreateUserDto } from './CreateUserDto';

export class CreateUserStateDto extends OmitType(CreateUserDto, [
  'role',
  'access_profile',
]) {
  @ApiProperty()
  @IsOptional()
  @IsString()
  city: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  idRegional: number;

  @ApiProperty({
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  idAccessProfile: number;

  subRole?: SubCredentialRole;
}
