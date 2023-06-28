import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { PaginationParams } from 'src/helpers/params';
import { Type } from 'class-transformer';

export class PaginationParamsByRegion extends PickType(PaginationParams, [
  'limit',
  'page',
  'order',
  'column',
  'search',
]) {
  @ApiProperty({
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  month: number;

  @ApiProperty({
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  year: number;

  @ApiProperty({
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  regionalPartnerId: number;
}
