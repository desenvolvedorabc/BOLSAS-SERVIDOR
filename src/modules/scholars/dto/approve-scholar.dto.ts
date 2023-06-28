import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class ApproveScholarDto {
  @ApiProperty({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  idAccessProfile: number;
}
