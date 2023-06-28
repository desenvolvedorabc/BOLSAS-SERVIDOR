import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SystemIndicatorsParcService } from './services/system-indicators-parc.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ParamsSystemIndicatorDto } from './dto/params-system-indicator.dto';
import { SystemIndicatorsStateService } from './services/system-indicators-state.service';
import { GetUser } from '../auth/decorator/current-user.decorator';
import { User } from '../user/model/entities/user.entity';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Role } from '../auth/decorator/role.decorator';
import { CredentialRole } from '../user/model/enum/role.enum';

@Controller('system-indicators')
@ApiTags('Indicadores do Sistema')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SystemIndicatorsController {
  constructor(
    private readonly systemIndicatorsParcService: SystemIndicatorsParcService,
    private readonly systemIndicatorsStateService: SystemIndicatorsStateService,
  ) {}

  @Role([CredentialRole.PARC])
  @Get('parc/macro-indicators-general')
  macroIndicatorsGeneral() {
    return this.systemIndicatorsParcService.macroIndicatorsGeneral();
  }

  @Role([CredentialRole.PARC])
  @Get('parc/system-active-states')
  systemActiveStates() {
    return this.systemIndicatorsParcService.systemActiveStates();
  }

  @Role([CredentialRole.PARC])
  @Get('parc/scholars')
  getScholarsForIndicator(
    @Query() paramsSystemIndicator: ParamsSystemIndicatorDto,
  ) {
    return this.systemIndicatorsParcService.getScholarsForIndicator(
      paramsSystemIndicator,
    );
  }

  @Role([CredentialRole.PARC])
  @Get('/parc/average-value-terms')
  getAverageValueTermsForIndicator(
    @Query() paramsSystemIndicator: ParamsSystemIndicatorDto,
  ) {
    return this.systemIndicatorsParcService.getAverageValueTermsForIndicator(
      paramsSystemIndicator,
    );
  }

  @Role([CredentialRole.PARC])
  @Get('/parc/terms-to-validate-stay')
  getTermsToValidateStayForIndicator(
    @Query() paramsSystemIndicator: ParamsSystemIndicatorDto,
  ) {
    return this.systemIndicatorsParcService.getTermsToValidateStayForIndicator(
      paramsSystemIndicator,
    );
  }

  @Role([CredentialRole.PARC])
  @Get('/parc/delivery-average-month-reports')
  getDeliveryAverageMonthReportsForIndicator(
    @Query() paramsSystemIndicator: ParamsSystemIndicatorDto,
  ) {
    return this.systemIndicatorsParcService.getDeliveryAverageMonthReportsForIndicator(
      paramsSystemIndicator,
    );
  }

  @Role([CredentialRole.ESTADO])
  @Get('/state/macro-indicators-general')
  getDeliveryAverageMonthReportsForIndicatorState(@GetUser() user: User) {
    return this.systemIndicatorsStateService.macroIndicatorsGeneral(user);
  }

  @Role([CredentialRole.ESTADO])
  @Get('/state/scholars')
  getScholarsForIndicatorState(
    @Query() paramsSystemIndicator: ParamsSystemIndicatorDto,
    @GetUser() user: User,
  ) {
    return this.systemIndicatorsStateService.getScholarsForIndicator(
      paramsSystemIndicator,
      user,
    );
  }

  @Role([CredentialRole.ESTADO])
  @Get('/state/average-value-terms')
  getAverageValueTermsForIndicatorState(
    @Query() paramsSystemIndicator: ParamsSystemIndicatorDto,
    @GetUser() user: User,
  ) {
    return this.systemIndicatorsStateService.getAverageValueTermsForIndicator(
      paramsSystemIndicator,
      user,
    );
  }

  @Role([CredentialRole.ESTADO])
  @Get('/state/month-reports')
  getTotalMonthReportsByStatusForIndicatorState(
    @Query() paramsSystemIndicator: ParamsSystemIndicatorDto,
    @GetUser() user: User,
  ) {
    return this.systemIndicatorsStateService.getTotalMonthReportsByStatusForIndicator(
      paramsSystemIndicator,
      user,
    );
  }

  @Role([CredentialRole.ESTADO])
  @Get('/state/scholars-pending-shipment')
  getScholarsPendingShipmentRegisterForIndicator(
    @Query() paramsSystemIndicator: ParamsSystemIndicatorDto,
    @GetUser() user: User,
  ) {
    return this.systemIndicatorsStateService.getScholarsPendingShipmentRegisterForIndicator(
      paramsSystemIndicator,
      user,
    );
  }

  @Role([CredentialRole.ESTADO])
  @Get('/state/work-plans-pending-shipment')
  getWorksPlansPendingShipmentForIndicator(
    @Query() paramsSystemIndicator: ParamsSystemIndicatorDto,
    @GetUser() user: User,
  ) {
    return this.systemIndicatorsStateService.getWorksPlansPendingShipmentForIndicator(
      paramsSystemIndicator,
      user,
    );
  }

  @Role([CredentialRole.ESTADO])
  @Get('/state/amount-invested-in-scholarship')
  getAmountInvestedInScholarship(
    @Query() paramsSystemIndicator: ParamsSystemIndicatorDto,
    @GetUser() user: User,
  ) {
    return this.systemIndicatorsStateService.amountInvestedInScholarship(
      paramsSystemIndicator,
      user,
    );
  }

  @Role([CredentialRole.ESTADO])
  @Get('/state/trained-teachers')
  teste(
    @Query() paramsSystemIndicator: ParamsSystemIndicatorDto,
    @GetUser() user: User,
  ) {
    return this.systemIndicatorsStateService.trainedTeachers(
      paramsSystemIndicator,
      user,
    );
  }
}
