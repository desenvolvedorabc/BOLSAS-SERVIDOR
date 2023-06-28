import { Controller, Post } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('jobs')
@ApiTags('Jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('notification-users-reports-pending-validation')
  @ApiOperation({
    summary: 'Notificar usuários sobre relatórios pendentes a ser analisados',
  })
  findAll() {
    this.jobsService.notificationUsersReportsPendingValidation();
    return;
  }

  @Post('inactive-users-with-expired-terms')
  @ApiOperation({
    summary:
      'Inativar usuários bolsistas que estão com o termo de adesão expirados.',
  })
  inactiveUsersWithExpiredTerms() {
    return this.jobsService.inactiveUsersWithExpiredTerms();
  }

  @Post('notification-scholars-reports-pending')
  @ApiOperation({
    summary: 'Notificar bolsistas sobre relatórios pendentes a ser enviados',
  })
  notificationScholarsReportsPending() {
    this.jobsService.notificationScholarsReportsPending();
    return;
  }
}
