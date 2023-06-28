import { ApiProperty } from '@nestjsx/crud/lib/crud';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReproveScholarDto {
  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(3000)
  justification: string;
}
