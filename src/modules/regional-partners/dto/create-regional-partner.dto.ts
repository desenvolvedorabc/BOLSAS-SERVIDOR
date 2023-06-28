import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateRegionalPartnerDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  abbreviation: string;

  @ApiProperty({
    isArray: true,
  })
  @IsNotEmpty({ message: 'Informe os municipios ' })
  @IsArray()
  @IsString({ each: true })
  cities: string[];
}
