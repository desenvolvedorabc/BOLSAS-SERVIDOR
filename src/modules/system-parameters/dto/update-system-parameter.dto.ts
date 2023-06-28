import { PartialType } from '@nestjs/swagger';
import { CreateSystemParameterDto } from './create-system-parameter.dto';

export class UpdateSystemParameterDto extends PartialType(CreateSystemParameterDto) {}
