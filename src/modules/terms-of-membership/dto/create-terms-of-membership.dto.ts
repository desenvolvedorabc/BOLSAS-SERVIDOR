import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTermsOfMembershipDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  project: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  workUnit: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  contractDescription: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  axle: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  payingSource: string;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  weekHours: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  scholarshipValue: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bagName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  startDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  endDate: Date;

  @ApiProperty()
  @IsOptional()
  @IsDate()
  extensionDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  scholarId: number;
}
