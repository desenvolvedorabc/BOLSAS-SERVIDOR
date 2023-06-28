import { forwardRef, Injectable, Inject } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/user/model/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateScheduleWorkPlanDto } from '../dto/create-schedule-work-plan.dto';
import { ScheduleWorkPlan } from '../entities/schedule-work-plan.entity';
import { WorkPlan } from '../entities/work-plan.entity';
import { WorkPlansService } from './work-plans.service';
import { UpdateScheduleWorkPlanDto } from '../dto/update-schedule-work-plan.dto';
import { InternalServerError } from 'src/shared/errors';

@Injectable()
export class SchedulesWorkPlanService {
  constructor(
    @InjectRepository(ScheduleWorkPlan)
    private readonly scheduleWorkPlanRepository: Repository<ScheduleWorkPlan>,

    @Inject(forwardRef(() => WorkPlansService))
    private readonly workPlansService: WorkPlansService,
  ) {}

  async create(
    createSchedule: CreateScheduleWorkPlanDto,
    workPlan: WorkPlan,
  ): Promise<ScheduleWorkPlan> {
    const { month, year, action, isFormer } = createSchedule;

    const schedule = await this.scheduleWorkPlanRepository
      .create({ month, year, action, workPlan, isFormer })
      .save();

    return schedule;
  }

  async findOne(id: number): Promise<ScheduleWorkPlan> {
    const schedule = await this.scheduleWorkPlanRepository.findOne({
      where: {
        id,
      },
      relations: ['workPlan'],
    });

    if (!schedule) {
      throw new NotFoundException('Cronograma não encontrado');
    }

    return schedule;
  }

  async update(
    id: number,
    updateScheduleWorkPlanDto: UpdateScheduleWorkPlanDto,
    user: User,
  ): Promise<void> {
    const schedule = await this.findOne(id);

    const workPlan = schedule.workPlan;
    await this.workPlansService.validateUpdateWorkPlan(workPlan.id, user);

    try {
      await this.scheduleWorkPlanRepository.update(id, {
        ...updateScheduleWorkPlanDto,
      });
    } catch (err) {
      throw new InternalServerError();
    }
  }

  async remove(id: number, user: User): Promise<void> {
    const schedule = await this.findOne(id);

    const workPlan = schedule.workPlan;
    await this.workPlansService.validateUpdateWorkPlan(workPlan.id, user);

    await this.scheduleWorkPlanRepository.remove(schedule);
  }
}
