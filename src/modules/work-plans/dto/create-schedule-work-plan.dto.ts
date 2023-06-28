import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateScheduleWorkPlanDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  month: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  year: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  action: string;

  @IsNotEmpty({
    message: 'Informe se o bolsista é formador ou não',
  })
  @IsBoolean()
  @ApiProperty()
  isFormer: boolean;
}
