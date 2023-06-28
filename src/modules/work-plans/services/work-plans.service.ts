import {
  forwardRef,
  Injectable,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/user/model/entities/user.entity';
import { CreateScheduleWorkPlanDto } from '../dto/create-schedule-work-plan.dto';
import { CreateWorkPlanDto } from '../dto/create-work-plan.dto';
import { PaginationParamsWorkPlans } from '../dto/pagination-params-work-plans.dto';
import { ReproveWorkPlanDto } from '../dto/reprove-work-plan.dto';
import { UpdateWorkPlanDto } from '../dto/update-work-plan.dto';
import { WorkPlan } from '../entities/work-plan.entity';
import { WorkPlanStatus } from '../enum/work-plan-status.enum';
import { ForbiddenWorkPlanError } from '../errors/forbidden-work-plan-error';
import { NotFoundWorkPlanError } from '../errors/not-found-work-plan-erro';
import { WorkPlansRepository } from '../repositories/work-plans.repository';
import { SchedulesWorkPlanService } from './schedules-work-plan.service';
import { ScheduleWorkPlan } from '../entities/schedule-work-plan.entity';
import { StatusActionMonthlyEnum } from 'src/modules/monthly-reports/enum/status-action-monthly.enum';
import { Repository } from 'typeorm';
import { TermsOfMembershipService } from 'src/modules/terms-of-membership/terms-of-membership.service';
import { TermOfMembershipStatus } from 'src/modules/terms-of-membership/enum/status-term-membership.enum';

@Injectable()
export class WorkPlansService {
  constructor(
    @InjectRepository(WorkPlansRepository)
    private readonly workPlanRepository: WorkPlansRepository,

    @InjectRepository(ScheduleWorkPlan)
    private readonly scheduleWorkPlanRepository: Repository<ScheduleWorkPlan>,

    @Inject(forwardRef(() => SchedulesWorkPlanService))
    private readonly schedulesWorkPlanService: SchedulesWorkPlanService,

    private readonly termsOfMembershipService: TermsOfMembershipService,
  ) {}

  async create(
    createWorkPlanDto: CreateWorkPlanDto,
    user: User,
  ): Promise<WorkPlan> {
    const { schedules } = createWorkPlanDto;

    const { termsOfMembership } = await this.termsOfMembershipService.me(
      user.id,
    );

    if (termsOfMembership.status !== TermOfMembershipStatus.ASSINADO) {
      throw new ForbiddenException(
        'Seu termo de compromisso precisa está assinado.',
      );
    }

    const workPlan = await this.workPlanRepository._create(
      createWorkPlanDto,
      user,
    );

    await this.createSchedules(schedules, workPlan);

    return workPlan;
  }

  private async createSchedules(
    createSchedules: CreateScheduleWorkPlanDto[],
    workPlan: WorkPlan,
  ): Promise<void> {
    for (const schedule of createSchedules) {
      await this.schedulesWorkPlanService.create(schedule, workPlan);
    }
  }

  async getActionsWorkPlanByMonthAndYear(
    month: number,
    year: number,
    user: User,
  ): Promise<ScheduleWorkPlan[]> {
    const workPlan = await this.findByUser(user, []);

    if (workPlan.status != WorkPlanStatus.APROVADO) {
      throw new ForbiddenException(
        'Seu plano de trabalho precisa ser aprovado primeiro.',
      );
    }

    const queryBuilder = this.scheduleWorkPlanRepository
      .createQueryBuilder('ScheduleWorkPlan')
      .where('ScheduleWorkPlan.workPlan = :workPlanId', {
        workPlanId: workPlan.id,
      })
      .andWhere(
        '((ScheduleWorkPlan.month <= :month AND ScheduleWorkPlan.year <= :year AND ScheduleWorkPlan.status != :status) OR (ScheduleWorkPlan.month < :month AND ScheduleWorkPlan.year < :year AND ScheduleWorkPlan.status != :status))',
        { month, year, status: StatusActionMonthlyEnum.CONCLUIDO },
      );

    const data = await queryBuilder.getMany();

    return data;
  }

  async findByUser(user: User, relations = ['schedules']): Promise<WorkPlan> {
    const workPlan = await this.workPlanRepository.findOne({
      where: {
        scholar: {
          id: user.id,
        },
      },
      order: {
        createdAt: 'DESC',
      },
      relations,
    });

    if (!workPlan) {
      throw new NotFoundWorkPlanError();
    }

    return workPlan;
  }

  generalSearch(paginationParams: PaginationParamsWorkPlans, user: User) {
    return this.workPlanRepository.generalSearch(paginationParams, user);
  }

  paginate(paginationParams: PaginationParamsWorkPlans, user: User) {
    return this.workPlanRepository.paginate(paginationParams, user);
  }

  async approve(id: number, user: User): Promise<void> {
    let workPlan = await this.findOneByUpdate(id);

    if (workPlan.status !== WorkPlanStatus.EM_VALIDACAO) {
      throw new ForbiddenWorkPlanError();
    }

    workPlan = Object.assign(workPlan, {
      ...workPlan,
      status: WorkPlanStatus.APROVADO,
      validationAt: new Date(),
    });

    await this.workPlanRepository._update(workPlan, user);
  }

  async reprove(
    id: number,
    dto: ReproveWorkPlanDto,
    user: User,
  ): Promise<void> {
    const { justification } = dto;
    let workPlan = await this.findOneByUpdate(id);

    if (workPlan.status !== WorkPlanStatus.EM_VALIDACAO) {
      throw new ForbiddenWorkPlanError();
    }

    workPlan = Object.assign(workPlan, {
      ...workPlan,
      status: WorkPlanStatus.REPROVADO,
      justificationReprove: justification,
    });

    await this.workPlanRepository._update(workPlan, user);
  }

  async inValidation(id: number, user: User): Promise<void> {
    let workPlan = await this.findOneByUpdate(id);

    if (workPlan.status !== WorkPlanStatus.PENDENTE_VALIDACAO) {
      throw new ForbiddenWorkPlanError();
    }

    workPlan = Object.assign(workPlan, {
      ...workPlan,
      status: WorkPlanStatus.EM_VALIDACAO,
    });

    await this.workPlanRepository._update(workPlan, user);
  }

  async sendForValidation(id: number, user: User): Promise<WorkPlan> {
    let workPlan = await this.findOne(id, user);

    if (workPlan.status !== WorkPlanStatus.PENDENTE_ENVIO) {
      throw new ForbiddenWorkPlanError();
    }

    workPlan = Object.assign(workPlan, {
      ...workPlan,
      status: WorkPlanStatus.PENDENTE_VALIDACAO,
      sendValidationAt: new Date(),
      validationAt: null,
    });

    return this.workPlanRepository._update(workPlan, user);
  }

  findOne(id: number, user: User): Promise<WorkPlan> {
    return this.workPlanRepository.findOneById(id, user);
  }

  async findOneByUpdate(id: number): Promise<WorkPlan> {
    const workPlan = await this.workPlanRepository.findOne({
      where: {
        id,
      },
    });

    if (!workPlan) {
      throw new NotFoundWorkPlanError();
    }

    return workPlan;
  }

  async findOneByUserAdmin(id: number) {
    const workPlan = await this.workPlanRepository.findOne({
      where: {
        id,
      },
      relations: ['scholar', 'scholar.scholar', 'schedules'],
    });

    if (!workPlan) {
      throw new NotFoundWorkPlanError();
    }

    const { termOfMembership } =
      await this.termsOfMembershipService.meForReport(workPlan?.scholar?.id);

    return {
      workPlan,
      termOfMembership,
    };
  }

  async update(
    id: number,
    updateWorkPlanDto: UpdateWorkPlanDto,
    user: User,
  ): Promise<WorkPlan> {
    let workPlan = await this.validateUpdateWorkPlan(id, user);
    let status = workPlan.status;

    if (workPlan.status !== WorkPlanStatus.PENDENTE_ENVIO) {
      status = WorkPlanStatus.PENDENTE_VALIDACAO;
    }

    workPlan = Object.assign(workPlan, {
      ...workPlan,
      ...updateWorkPlanDto,
      status,
      sendValidationAt: new Date(),
    });

    return this.workPlanRepository._update(workPlan, user);
  }

  async validateUpdateWorkPlan(id: number, user: User): Promise<WorkPlan> {
    const workPlan = await this.findOne(id, user);

    const status = [
      WorkPlanStatus.PENDENTE_ENVIO,
      WorkPlanStatus.REPROVADO,
      WorkPlanStatus.PENDENTE_VALIDACAO,
    ];

    if (!status.includes(workPlan.status)) {
      throw new ForbiddenWorkPlanError();
    }

    return workPlan;
  }

  async remove(id: number, user: User): Promise<void> {
    const workPlan = await this.findOne(id, user);

    if (workPlan.status !== WorkPlanStatus.PENDENTE_VALIDACAO) {
      throw new ForbiddenWorkPlanError();
    }

    await this.workPlanRepository.remove(workPlan, {
      data: user,
    });
  }
}
