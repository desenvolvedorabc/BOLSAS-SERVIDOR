import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ChangeAdminScholarDto {
  @IsNotEmpty({
    message: 'Informe se o bolsista é formador ou não',
  })
  @IsBoolean()
  @ApiProperty()
  isFormer: boolean;
}
