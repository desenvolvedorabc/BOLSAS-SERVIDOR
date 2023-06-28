import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CredentialRole } from 'src/modules/user/model/enum/role.enum';

export class CreateAreaDto {
  @ApiProperty({
    type: String,
  })
  @IsString()
  @IsNotEmpty({
    message: 'Informe o nome da area de acesso',
  })
  name: string;

  @ApiProperty({
    enum: CredentialRole,
  })
  @IsNotEmpty({
    message: 'Informe a role do perfil',
  })
  @IsEnum(CredentialRole)
  role: CredentialRole;

  @ApiProperty({
    type: String,
  })
  @IsString()
  @IsNotEmpty({
    message: 'Informe a tag da area de aceso.',
  })
  tag: string;
}
