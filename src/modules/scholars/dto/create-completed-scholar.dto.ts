import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { AccountTypeEnum } from '../enum/account-type.enum';

export class CreateCompletedScholarDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  rg: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  sex: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  axle: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  maritalStatus: string;

  @IsNotEmpty()
  @IsDate()
  @ApiProperty()
  dateOfBirth: Date;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  motherName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  fatherName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  cep: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  state: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  city: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  address: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  bank: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  agency: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  accountNumber: string;

  @ApiProperty({
    enum: AccountTypeEnum,
  })
  @IsNotEmpty()
  @IsEnum(AccountTypeEnum)
  accountType: AccountTypeEnum;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  trainingArea: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  highestDegree: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  employmentRelationship: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  instituteOfOrigin: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  functionalStatus: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  locationDevelopWorkPlan: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  bagDescription: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  agreementOfTheEducationNetwork: string;
}
