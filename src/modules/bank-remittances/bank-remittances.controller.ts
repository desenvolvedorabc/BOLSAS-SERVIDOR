import { Controller, Get, Header, Res, Query, UseGuards } from '@nestjs/common';
import { BankRemittancesService } from './bank-remittances.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { GetBankRemittancesParamsDto } from './dto/get-bank-remittances-params.dto';
import { GetUser } from '../auth/decorator/current-user.decorator';
import { User } from '../user/model/entities/user.entity';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { PaginationParamsByRegion } from './dto/pagination-params-by-region.dto';

@Controller('bank-remittances')
@ApiTags('Remessas Bancárias')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BankRemittancesController {
  constructor(
    private readonly bankRemittancesService: BankRemittancesService,
  ) {}

  @Get('report-by-region')
  reportByRegion(
    @Query() paginationParamsByRegion: PaginationParamsByRegion,
    @GetUser() user: User,
  ) {
    return this.bankRemittancesService.reportByRegion(
      paginationParamsByRegion,
      user,
    );
  }

  @Get('approved')
  @Header('Content-Type', 'text/xlsx')
  async approved(
    @Res() response: Response,
    @Query() getBankRemittancesParamsDto: GetBankRemittancesParamsDto,
    @GetUser() user: User,
  ) {
    const result = await this.bankRemittancesService.approved(
      response,
      getBankRemittancesParamsDto,
      user,
    );

    return result;
  }

  @Get('reproved')
  @Header('Content-Type', 'text/xlsx')
  async reproved(
    @Res() response: Response,
    @Query() getBankRemittancesParamsDto: GetBankRemittancesParamsDto,
    @GetUser() user: User,
  ) {
    const result = await this.bankRemittancesService.reproved(
      response,
      getBankRemittancesParamsDto,
      user,
    );

    return result;
  }

  @Get('no-validation')
  @Header('Content-Type', 'text/xlsx')
  async noValidation(
    @Res() response: Response,
    @Query() getBankRemittancesParamsDto: GetBankRemittancesParamsDto,
    @GetUser() user: User,
  ) {
    const result = await this.bankRemittancesService.noValidation(
      response,
      getBankRemittancesParamsDto,
      user,
    );

    return result;
  }

  @Get('annual-shipment-for-scholar')
  @Header('Content-Type', 'text/xlsx')
  async annualShipmentForScholar(
    @Res() response: Response,
    @GetUser() user: User,
  ) {
    const result = await this.bankRemittancesService.annualShipmentForScholar(
      response,
      user,
    );

    return result;
  }
}
