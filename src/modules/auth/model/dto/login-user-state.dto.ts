import { ApiProperty } from '@nestjsx/crud/lib/crud';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { LoginUserDto } from './LoginUserDto';

export class LoginUserStateDto extends LoginUserDto {
  @ApiProperty({
    type: Number,
  })
  @IsNotEmpty({
    message: 'Informe o ID do estado parceiro',
  })
  @IsNumber()
  idPartnerState: number;
}
