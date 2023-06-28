import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationParams } from 'src/helpers/params';
import { GetUser } from 'src/modules/auth/decorator/current-user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';
import { User } from 'src/modules/user/model/entities/user.entity';
import { CredentialRole } from 'src/modules/user/model/enum/role.enum';
import { CreateAccessProfileDto } from '../model/dto/create-access-profile.dto';
import { CreateAreaDto } from '../model/dto/create-area.dto';
import { UpdateAccessProfileDto } from '../model/dto/update-access-profile.dto';
import { ProfileService } from '../service/profile.service';

@Controller('profile')
@ApiTags('Perfil')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Post('')
  createAccessProfile(
    @GetUser() user: User,
    @Body() dto: CreateAccessProfileDto,
  ) {
    return this.profileService.createAccessProfile(dto, user);
  }

  @Post('/create-area')
  createArea(@Body() dto: CreateAreaDto) {
    return this.profileService.createArea(dto);
  }

  @Get('')
  paginate(@Query() dto: PaginationParams, @GetUser() user: User) {
    return this.profileService.paginateAccessProfile(dto, user);
  }

  @Get('for-edit-users')
  paginateForEditUsers(@Query() dto: PaginationParams, @GetUser() user: User) {
    return this.profileService.paginateForEditUsers(dto, user);
  }

  @Get('/general/search')
  generalSearch(@Query() dto: PaginationParams, @GetUser() user: User) {
    if (user.role === CredentialRole.PARC) {
      return this.profileService.paginateAccessProfile(dto, user);
    }

    return this.profileService.generalSearchByProfile(dto, user);
  }

  @Get('/areas/all')
  findAreasAll(@GetUser() user: User) {
    return this.profileService.findAreasAll(user.role);
  }

  @Get('/:id')
  findOneAccessProfile(@Param('id') id: number) {
    return this.profileService.findOneAccessProfile(id);
  }

  @Put(':id')
  updateAccessProfile(
    @GetUser() user: User,
    @Param('id') id: number,
    @Body() dto: UpdateAccessProfileDto,
  ): Promise<void> {
    return this.profileService.updateAccessProfile(id, dto, user);
  }
}
