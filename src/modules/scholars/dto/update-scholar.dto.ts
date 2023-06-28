import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateScholarDto } from './create-scholar.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateScholarDto extends PartialType(
  OmitType(CreateScholarDto, ['city', 'cpf', 'idRegional', 'isFormer', 'name']),
) {
  @ApiProperty({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  idAccessProfile: number;
}
