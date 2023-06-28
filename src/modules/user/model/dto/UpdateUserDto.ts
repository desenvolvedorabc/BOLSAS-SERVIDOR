import { PartialType } from '@nestjs/mapped-types';
import { OmitType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CreateUserDto } from './CreateUserDto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['role']),
) {
  @IsOptional()
  active?: boolean;
}
