import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Patch,
} from '@nestjs/common';
import { CreateWorkPlanDto } from './dto/create-work-plan.dto';
import { UpdateWorkPlanDto } from './dto/update-work-plan.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorator/current-user.decorator';
import { User } from '../user/model/entities/user.entity';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { WorkPlan } from './entities/work-plan.entity';
import { WorkPlansService } from './services/work-plans.service';
import { SchedulesWorkPlanService } from './services/schedules-work-plan.service';
import { CreateScheduleWorkPlanDto } from './dto/create-schedule-work-plan.dto';
import { ScheduleWorkPlan } from './entities/schedule-work-plan.entity';
import { PaginationParamsWorkPlans } from './dto/pagination-params-work-plans.dto';
import { ReproveWorkPlanDto } from './dto/reprove-work-plan.dto';
import { AreasGuard } from '../auth/guard/areas.guard';
import { Areas } from '../auth/decorator/areas.decorator';
import { PaginationParamsMonthlyReports } from '../monthly-reports/dto/pagination-params-monthly-reports.dto';
import { UpdateScheduleWorkPlanDto } from './dto/update-schedule-work-plan.dto';

@Controller('work-plans')
@ApiTags('Planos de Trabalho')
@UseGuards(JwtAuthGuard, AreasGuard)
@ApiBearerAuth()
export class WorkPlansController {
  constructor(
    private readonly workPlansService: WorkPlansService,
    private readonly scheduleWorkPlansService: SchedulesWorkPlanService,
  ) {}

  @Post()
  @Areas(['PLN_TRAB'])
  create(
    @Body() createWorkPlanDto: CreateWorkPlanDto,
    @GetUser() user: User,
  ): Promise<WorkPlan> {
    return this.workPlansService.create(createWorkPlanDto, user);
  }

  @Post(':id')
  @Areas(['PLN_TRAB'])
  sendForValidation(
    @Param('id') id: number,
    @GetUser() user: User,
  ): Promise<WorkPlan> {
    return this.workPlansService.sendForValidation(id, user);
  }

  @Get()
  @Areas(['APRO_PLN_TRAB'])
  paginate(
    @Query() paginationParams: PaginationParamsWorkPlans,
    @GetUser() user: User,
  ) {
    return this.workPlansService.paginate(paginationParams, user);
  }

  @Get('general-search')
  @Areas(['APRO_PLN_TRAB'])
  generalSearch(
    @Query() paginationParams: PaginationParamsWorkPlans,
    @GetUser() user: User,
  ) {
    return this.workPlansService.generalSearch(paginationParams, user);
  }

  @Get('/actions')
  getActionsWorkPlanByMonthAndYear(
    @GetUser() user: User,
    @Query() { month, year }: PaginationParamsMonthlyReports,
  ) {
    return this.workPlansService.getActionsWorkPlanByMonthAndYear(
      month,
      year,
      user,
    );
  }

  @Get(':id')
  @Areas(['APRO_PLN_TRAB'])
  findOne(@Param('id') id: number) {
    return this.workPlansService.findOneByUserAdmin(id);
  }

  @Get('/user/me')
  @Areas(['PLN_TRAB'])
  findByUser(@GetUser() user: User): Promise<WorkPlan> {
    return this.workPlansService.findByUser(user);
  }

  @Patch(':id')
  @Areas(['PLN_TRAB'])
  update(
    @Param('id') id: number,
    @Body() updateWorkPlanDto: UpdateWorkPlanDto,
    @GetUser() user: User,
  ): Promise<WorkPlan> {
    return this.workPlansService.update(id, updateWorkPlanDto, user);
  }

  @Patch(':id/approve')
  @Areas(['APRO_PLN_TRAB'])
  approve(@Param('id') id: number, @GetUser() user: User): Promise<void> {
    return this.workPlansService.approve(id, user);
  }

  @Patch(':id/reprove')
  @Areas(['APRO_PLN_TRAB'])
  reprove(
    @Param('id') id: number,
    @Body() dto: ReproveWorkPlanDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.workPlansService.reprove(id, dto, user);
  }

  @Patch(':id/in-validation')
  @Areas(['APRO_PLN_TRAB'])
  inValidation(@Param('id') id: number, @GetUser() user: User): Promise<void> {
    return this.workPlansService.inValidation(id, user);
  }

  @Delete(':id')
  @Areas(['PLN_TRAB'])
  remove(@Param('id') id: number, @GetUser() user: User): Promise<void> {
    return this.workPlansService.remove(id, user);
  }

  @Post(':id/schedule')
  @Areas(['PLN_TRAB'])
  async createSchedule(
    @Param('id') id: number,
    @Body() createScheduleDto: CreateScheduleWorkPlanDto,
    @GetUser() user: User,
  ): Promise<ScheduleWorkPlan> {
    const workPlan = await this.workPlansService.validateUpdateWorkPlan(
      id,
      user,
    );

    return this.scheduleWorkPlansService.create(createScheduleDto, workPlan);
  }

  @Patch('/schedule/:id')
  @Areas(['PLN_TRAB'])
  updateSchedule(
    @Param('id') id: number,
    @GetUser() user: User,
    @Body() updateScheduleWorkPlanDto: UpdateScheduleWorkPlanDto,
  ): Promise<void> {
    return this.scheduleWorkPlansService.update(
      id,
      updateScheduleWorkPlanDto,
      user,
    );
  }

  @Delete('/schedule/:id')
  @Areas(['PLN_TRAB'])
  removeSchedule(
    @Param('id') id: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.scheduleWorkPlansService.remove(id, user);
  }
}
