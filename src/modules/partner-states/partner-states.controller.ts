import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  Res,
  Header,
} from '@nestjs/common';
import { PartnerStatesService } from './partner-states.service';
import { CreatePartnerStateDto } from './dto/create-partner-state.dto';
import { UpdatePartnerStateDto } from './dto/update-partner-state.dto';
import { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { GetUser } from '../auth/decorator/current-user.decorator';
import { User } from '../user/model/entities/user.entity';
import { PaginationParams } from 'src/helpers/params';

@Controller('partner-states')
@ApiTags('Estados Parceiros')
export class PartnerStatesController {
  constructor(private readonly partnerStatesService: PartnerStatesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(
    @GetUser() user: User,
    @Body() createPartnerStateDto: CreatePartnerStateDto,
  ) {
    return this.partnerStatesService.create(createPartnerStateDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findAll(@Query() paginationParams: PaginationParams) {
    return this.partnerStatesService.findAll(paginationParams);
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findOne(@Param('id') id: number) {
    return this.partnerStatesService.findOne(id);
  }

  @Get('/slug/:slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.partnerStatesService.findOneBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(
    @GetUser() user: User,
    @Param('id') id: number,
    @Body() updatePartnerStateDto: UpdatePartnerStateDto,
  ) {
    return this.partnerStatesService.update(id, updatePartnerStateDto, user);
  }

  @Get('/reports/excel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Header('Content-Type', 'text/xlsx')
  async usersReportByExcel(
    @Query() paginationParams: PaginationParams,
    @Res() response: Response,
  ) {
    const result = await this.partnerStatesService.excel(
      paginationParams,
      response,
    );

    return result;
  }

  @Post('avatar/upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadAvatar(@GetUser() user: User, @Body() data: any) {
    const { id, filename, base64 } = data;

    return this.partnerStatesService.updateAvatar(id, filename, base64, user);
  }
}
