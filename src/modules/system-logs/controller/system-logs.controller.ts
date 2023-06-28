import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
  Header,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { Pagination } from 'nestjs-typeorm-paginate';
import { SystemLogsService } from '../service/system-logs.service';
import { SystemLogs } from '../model/entities/system-log.entity';
import { PaginationParamsLogs } from 'src/helpers/params';
import { GetUser } from 'src/modules/auth/decorator/current-user.decorator';
import { User } from 'src/modules/user/model/entities/user.entity';

@ApiTags('Logs do Sistema')
@Controller('system-logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SystemLogsController {
  constructor(private readonly systemLogsService: SystemLogsService) {}

  @Get()
  paginate(
    @Query() paginationParams: PaginationParamsLogs,
    @GetUser() user: User,
  ): Promise<Pagination<SystemLogs>> {
    return this.systemLogsService.paginate(paginationParams, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<SystemLogs> {
    return this.systemLogsService.findOne(id);
  }

  @Get('/reports/excel')
  @Header('Content-Type', 'text/xlsx')
  async usersReportByExcel(
    @Query() paginationParams: PaginationParamsLogs,
    @Res() response: Response,
    @GetUser() user: User,
  ) {
    const result = await this.systemLogsService.generateExcel(
      paginationParams,
      response,
      user,
    );

    return result;
  }
}
