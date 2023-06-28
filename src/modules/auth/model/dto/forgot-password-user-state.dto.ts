import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { ForgotPasswordDto } from './ForgotPasswordDto';

export class ForgotPasswordUserStateDto extends ForgotPasswordDto {
  @ApiProperty({
    type: Number,
  })
  @IsNotEmpty({
    message: 'Informe o ID do estado parceiro',
  })
  @IsNumber()
  idPartnerState: number;
}
