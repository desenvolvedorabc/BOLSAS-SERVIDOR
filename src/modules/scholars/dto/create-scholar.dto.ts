import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateScholarDto {
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
  @IsString()
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

  @IsNotEmpty({
    message: 'Informe se o bolsista é formador ou não',
  })
  @IsBoolean()
  @ApiProperty()
  isFormer: boolean;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  axle: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsNumber()
  idRegional: number;
}
