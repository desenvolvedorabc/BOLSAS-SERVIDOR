import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Area } from '../entities/area.entity';
import { ProfileRole } from '../enum/profile-role';

export class CreateAccessProfileDto {
  @ApiProperty({
    type: String,
  })
  @IsString()
  @IsNotEmpty({
    message: 'Informe o nome do perfil de acesso.',
  })
  name: string;

  @ApiProperty()
  @IsNotEmpty({
    message: 'Informe a role do perfil',
  })
  @IsEnum(ProfileRole)
  role: ProfileRole;

  @ApiProperty({
    type: Array<Area>(),
  })
  @IsArray()
  @IsNotEmpty({
    message: 'Informe pelo menos uma area de acesso',
  })
  areas: Area[];
}
