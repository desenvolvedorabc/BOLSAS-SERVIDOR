import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Put,
  Res,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RegionalPartnersService } from './regional-partners.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateRegionalPartnerDto } from './dto/create-regional-partner.dto';
import { GetUser } from '../auth/decorator/current-user.decorator';
import { User } from '../user/model/entities/user.entity';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RegionalPartner } from './entities/regional-partner.entity';
import { PaginationParams } from 'src/helpers/params';
import { UpdateRegionalPartnerDto } from './dto/update-regional-partner.dto';
import { Response } from 'express';

@Controller('regional-partners')
@ApiTags('Regionais Parceiras')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RegionalPartnersController {
  constructor(
    private readonly regionalPartnersService: RegionalPartnersService,
  ) {}

  @Post()
  create(
    @Body() createRegionalPartnerDto: CreateRegionalPartnerDto,
    @GetUser() user: User,
  ): Promise<RegionalPartner> {
    return this.regionalPartnersService.create(createRegionalPartnerDto, user);
  }

  @Get('by-partner-state')
  byPartnerState(@Query() paginationParams: PaginationParams) {
    return this.regionalPartnersService.byPartnerState(paginationParams);
  }

  @Get(':id')
  findOne(
    @GetUser() user: User,
    @Param('id') id: number,
  ): Promise<RegionalPartner> {
    const partnerState = user.partner_state;

    return this.regionalPartnersService.findOneById(id, partnerState.id);
  }

  @Get()
  paginate(@Query() paginationParams: PaginationParams, @GetUser() user: User) {
    return this.regionalPartnersService.paginate(paginationParams, user);
  }

  @Put(':id')
  updatge(
    @Param('id') id: number,
    @Body() dto: UpdateRegionalPartnerDto,
    @GetUser() user: User,
  ) {
    return this.regionalPartnersService.update(id, dto, user);
  }

  @Get('/report/excel')
  @Header('Content-Type', 'text/xlsx')
  async reportByExcel(
    @Query() paginationParams: PaginationParams,
    @GetUser() user: User,
    @Res() response: Response,
  ) {
    const result = await this.regionalPartnersService.excel(
      paginationParams,
      response,
      user,
    );

    return result;
  }
}
