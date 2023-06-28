import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({
    message: 'Informe a nova senha',
  })
  @ApiProperty()
  password: string;

  @IsString()
  @IsNotEmpty({
    message: 'Informe sua senha atual',
  })
  @ApiProperty()
  currentPassword: string;
}
