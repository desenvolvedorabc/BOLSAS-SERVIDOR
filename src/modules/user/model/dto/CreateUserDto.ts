import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { AccessProfile } from 'src/modules/profile/model/entities/access-profile.entity';
import { CredentialRole } from '../enum/role.enum';

export class CreateUserDto {
  @IsNotEmpty({
    message: 'Informe o nome do usuário',
  })
  @IsString()
  @ApiProperty()
  name: string;

  @IsNotEmpty({
    message: 'Informe o e-mail',
  })
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsNotEmpty({
    message: 'Informe o telefone',
  })
  @ApiProperty()
  telephone: string;

  @IsNotEmpty({
    message: 'Informe o CPF',
  })
  @MinLength(11, {
    message: 'O cpf deve conter 11 digitos',
  })
  @ApiProperty()
  cpf: string;

  @ApiProperty()
  @IsNotEmpty({
    message: 'Informe a role do usuário',
  })
  @IsEnum(CredentialRole)
  role: CredentialRole;

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  @IsString()
  access_profile: AccessProfile;

  @ApiProperty({
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  idPartnerState?: number;
}
