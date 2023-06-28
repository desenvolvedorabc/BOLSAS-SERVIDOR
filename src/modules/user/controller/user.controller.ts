import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  Header,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PaginationParams } from 'src/helpers/params';
import { GetUser } from 'src/modules/auth/decorator/current-user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';
import { ChangePasswordDto } from 'src/modules/auth/model/dto/ChangePasswordDto';
import { CreateUserStateDto } from '../model/dto/create-user-state';
import { CreateUserDto } from '../model/dto/CreateUserDto';
import { UpdateUserStateDto } from '../model/dto/update-user-state';
import { UpdateUserDto } from '../model/dto/UpdateUserDto';
import { User } from '../model/entities/user.entity';
import { CredentialRole } from '../model/enum/role.enum';
import { UsersStateService } from '../service/user-state.service';
import { UserService } from '../service/user.service';

@Controller('users')
@ApiTags('Usuário')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(
    private userService: UserService,
    private usersStateService: UsersStateService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/create')
  create(@GetUser() user: User, @Body() dto: CreateUserDto): Promise<User> {
    return this.userService.create(dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/state')
  createUserState(
    @GetUser() user: User,
    @Body() dto: CreateUserStateDto,
  ): Promise<User> {
    return this.usersStateService.create(dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/welcome-reset-password/:id')
  welcomePasswordChangeLink(@Param('id') id: number) {
    return this.userService.welcomePasswordChangeLink(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('/change-password')
  changePassword(@GetUser() user: User, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('')
  paginate(@Query() dto: PaginationParams, @GetUser() user: User) {
    if (user.role === CredentialRole.ESTADO) {
      return this.usersStateService.paginate(dto, user);
    }

    return this.userService.paginate(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('/notifications')
  getForNotifications(@Query() dto: PaginationParams, @GetUser() user: User) {
    return this.usersStateService.getForNotifications(dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('general/search')
  generalSearch(
    @Query() paginationParams: PaginationParams,
    @GetUser() user: User,
  ) {
    if (user.role === CredentialRole.ESTADO) {
      return this.usersStateService.generalSearch(paginationParams, user);
    }

    return this.userService.paginate(paginationParams);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('/:id')
  findOne(@Param('id') id: number) {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('/:id')
  update(
    @GetUser() user: User,
    @Param('id') id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(id, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('/state/:id')
  updateUserState(
    @GetUser() user: User,
    @Param('id') id: number,
    @Body() dto: UpdateUserStateDto,
  ): Promise<User> {
    return this.usersStateService.update(id, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('/:id/inactivate')
  inactivate(@GetUser() user: User, @Param('id') id: number): Promise<void> {
    return this.usersStateService.inactivate(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('avatar/upload')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadAvatar(@GetUser() user: User, @Body() data: any) {
    const { id, filename, base64 } = data;

    return this.userService.updateAvatar(id, filename, base64, user);
  }

  @Get('/avatar/:imgpath')
  seeUploadedAvatar(@Param('imgpath') image: string, @Res() res) {
    return res.sendFile(image, { root: './public/user/avatar' });
  }

  @Get('/reports/excel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Header('Content-Type', 'text/xlsx')
  async usersReportByExcel(
    @Query() paginationParams: PaginationParams,
    @Res() response: Response,
  ) {
    const result = await this.userService.usersReportByExcel(
      paginationParams,
      response,
    );

    return result;
  }

  @Get('/state/reports/excel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Header('Content-Type', 'text/xlsx')
  async stateUsersReportByExcel(
    @Query() paginationParams: PaginationParams,
    @Res() response: Response,
    @GetUser() user: User,
  ) {
    let result = null;

    if (user.role === CredentialRole.PARC) {
      result = await this.userService.stateUsersReportByExcel(
        paginationParams,
        response,
      );
    } else {
      result = await this.usersStateService.getExcelUsers(
        paginationParams,
        response,
        user,
      );
    }

    return result;
  }
}
