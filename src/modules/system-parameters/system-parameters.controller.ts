import { Controller, Get, Post, Body, UseGuards, Patch } from '@nestjs/common';
import { SystemParametersService } from './system-parameters.service';
import { CreateSystemParameterDto } from './dto/create-system-parameter.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { User } from '../user/model/entities/user.entity';
import { GetUser } from '../auth/decorator/current-user.decorator';
import { SubRolesGuard } from '../auth/guard/sub-roles.guard';
import { Role } from '../auth/decorator/role.decorator';
import { SubCredentialRole } from '../user/model/enum/sub-role.enum';
import { UpdateSystemParameterDto } from './dto/update-system-parameter.dto';

@Controller('system-parameters')
@ApiTags('Parâmetros do Sistema')
@UseGuards(JwtAuthGuard, SubRolesGuard)
@ApiBearerAuth()
export class SystemParametersController {
  constructor(
    private readonly systemParametersService: SystemParametersService,
  ) {}

  @Post()
  @Role([SubCredentialRole.ADMIN])
  create(
    @Body() createSystemParameterDto: CreateSystemParameterDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.systemParametersService.create(createSystemParameterDto, user);
  }

  @Get('/me')
  @Role([SubCredentialRole.ADMIN])
  findAll(@GetUser() user: User) {
    return this.systemParametersService.me(user);
  }

  @Patch('/me')
  @Role([SubCredentialRole.ADMIN])
  update(
    @GetUser() user: User,
    @Body() updateSystemParameterDto: UpdateSystemParameterDto,
  ): Promise<void> {
    return this.systemParametersService.update(user, updateSystemParameterDto);
  }
}
