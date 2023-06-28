import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginateData } from 'src/helpers/return-data-paginate';
import { ForbiddenError, InternalServerError } from 'src/shared/errors';
import { Repository } from 'typeorm';
import { ScholarsService } from '../scholars/scholars.service';
import { User } from '../user/model/entities/user.entity';
import { CreateMonthlyReportDto } from './dto/create-monthly-report.dto';
import { PaginationParamsMonthlyReports } from './dto/pagination-params-monthly-reports.dto';
import { UpdateMonthlyReportDto } from './dto/update-monthly-report.dto';
import { MonthlyReport } from './entities/monthly-report.entity';
import { MonthlyReportStatus } from './enum/monthly-report-status.enum';
import { ScheduleWorkPlan } from '../work-plans/entities/schedule-work-plan.entity';
import { StatusActionMonthlyEnum } from './enum/status-action-monthly.enum';
import { WorkPlansService } from '../work-plans/services/work-plans.service';
import { ActionMonthlyReport } from './entities/action-monthly-report.entity';
import { ValidationHistory } from 'src/shared/entities/validation-history.entity';
import { LevelApproveRegistration } from './dto/level-approve-registration.enum';
import { ReproveMonthlyReport } from './dto/reprove-scholar.dto';
import { ProfileRole } from '../profile/model/enum/profile-role';
import { SystemParametersService } from '../system-parameters/system-parameters.service';
import { TermsOfMembershipService } from '../terms-of-membership/terms-of-membership.service';
import { BankRemittancesService } from '../bank-remittances/bank-remittances.service';
import { TermOfMembershipStatus } from '../terms-of-membership/enum/status-term-membership.enum';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MonthlyReportsService {
  constructor(
    @InjectRepository(MonthlyReport)
    private readonly monthlyReportRepository: Repository<MonthlyReport>,

    @InjectRepository(ActionMonthlyReport)
    private readonly actionMonthlyReportRepository: Repository<ActionMonthlyReport>,

    @InjectRepository(ScheduleWorkPlan)
    private readonly scheduleWorkPlanRepository: Repository<ScheduleWorkPlan>,

    @InjectRepository(ValidationHistory)
    private readonly validationHistoryRepository: Repository<ValidationHistory>,

    private readonly scholarsService: ScholarsService,
    private readonly systemParametersService: SystemParametersService,
    private readonly workPlanService: WorkPlansService,
    private readonly termsOfMembershipService: TermsOfMembershipService,
    private readonly bankRemittancesService: BankRemittancesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    createMonthlyReportDto: CreateMonthlyReportDto,
    user: User,
    file?: Express.Multer.File,
  ) {
    const { month, year, actions } = createMonthlyReportDto;
    const role = user?.access_profile?.role;

    if (!role) {
      throw new ForbiddenError();
    }

    const { scholar } = await this.scholarsService.meForReports(user);
    const { termsOfMembership } = await this.termsOfMembershipService.me(
      user.id,
    );

    if (termsOfMembership.status !== TermOfMembershipStatus.ASSINADO) {
      throw new ForbiddenException(
        'Seu termo de compromisso precisa está assinado.',
      );
    }

    await this.systemParametersService.verifyLimitSendMonthlyReport(
      user.partnerStateId,
    );

    const schedulesActions =
      await this.workPlanService.getActionsWorkPlanByMonthAndYear(
        month,
        year,
        user,
      );

    const levelByProfile = {
      [ProfileRole.BOLSISTA]: LevelApproveRegistration.MUNICIPIO,
      [ProfileRole.MUNICIPIO]: LevelApproveRegistration.REGIONAL,
      [ProfileRole.REGIONAL]: LevelApproveRegistration.ESTADO,
    };

    const levelApproveRegistration = levelByProfile[role];

    if (!levelApproveRegistration) {
      throw new ForbiddenError();
    }

    if (actions.length !== schedulesActions.length) {
      throw new ForbiddenException(
        'Você precisa informar todas as ações do mês do seu plano de trabalho.',
      );
    }

    const verifyExistsMonthlyReport =
      await this.monthlyReportRepository.findOne({
        where: {
          month,
          year,
          scholarId: scholar.id,
        },
      });

    if (verifyExistsMonthlyReport) {
      throw new ConflictException(
        'Já existe um relatório criado nesse mês/ano.',
      );
    }

    let monthlyReport = this.monthlyReportRepository.create({
      month,
      year,
      scholar,
      levelApproveRegistration,
    });

    if (file) {
      monthlyReport.actionDocument = file.filename;
    }

    try {
      monthlyReport = await this.monthlyReportRepository.save(monthlyReport, {
        data: user,
      });

      await Promise.all(
        actions.map(async (action) => {
          const {
            detailing,
            qntExpectedGraduates,
            qntFormedGifts,
            status,
            detailingResult,
            scheduleWorkPlanId,
            workloadInMinutes,
            trainingDate,
            trainingModality,
          } = action;
          const scheduleWorkPlan = schedulesActions.find(
            (schedule) => schedule.id === scheduleWorkPlanId,
          );

          if (scheduleWorkPlan) {
            const actionMonthlyReport =
              this.actionMonthlyReportRepository.create({
                detailing,
                qntExpectedGraduates,
                qntFormedGifts,
                detailingResult,
                workloadInMinutes,
                status,
                trainingDate,
                trainingModality,
                scheduleWorkPlan,
                monthlyReport,
              });

            await this.actionMonthlyReportRepository.save(actionMonthlyReport);

            await this.scheduleWorkPlanRepository.update(scheduleWorkPlan.id, {
              status,
            });
          }
        }),
      );

      this.bankRemittancesService.create(
        {
          accountNumber: scholar.accountNumber,
          accountType: scholar.accountType,
          agency: scholar.agency,
          bank: scholar.bank,
          monthlyReport,
          scholarshipValueInCents: termsOfMembership.scholarshipValueInCents,
          termOfMembershipId: termsOfMembership.id,
        },
        user,
      );

      return {
        monthlyReport: {
          id: monthlyReport.id,
        },
      };
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async addFile(id: number, file: Express.Multer.File): Promise<void> {
    if (!file) {
      throw new BadRequestException('Você precisa informar o arquivo');
    }

    const { monthlyReport } = await this.findOne(id, []);

    const statusForUpdate = [
      MonthlyReportStatus.REPROVADO,
      MonthlyReportStatus.PENDENTE_VALIDACAO,
      MonthlyReportStatus.PENDENTE_ENVIO,
    ];

    if (!statusForUpdate.includes(monthlyReport.status)) {
      throw new ForbiddenError();
    }

    try {
      await this.monthlyReportRepository.update(id, {
        actionDocument: file.filename,
      });
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async findAll(paginationParams: PaginationParamsMonthlyReports, user: User) {
    const { page, limit, search, month, status } = paginationParams;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessProfile: any = user?.access_profile;

    const levelsApprove = {
      [LevelApproveRegistration.MUNICIPIO]:
        'MonthlyReport.validationHistoryCounty IS NOT NULL',
      [LevelApproveRegistration.REGIONAL]:
        'MonthlyReport.validationHistoryRegional IS NOT NULL',
      [LevelApproveRegistration.ESTADO]:
        'MonthlyReport.validationHistoryState IS NOT NULL',
    };

    const levelValidate =
      levelsApprove[accessProfile?.role] ??
      'MonthlyReport.levelApproveRegistration IS NOT NULL';

    const queryBuilder = this.monthlyReportRepository
      .createQueryBuilder('MonthlyReport')
      .select(['MonthlyReport', 'scholar.id', 'user.name'])
      .innerJoin('MonthlyReport.scholar', 'scholar')
      .leftJoin('scholar.user', 'user')
      .where('user.partner_state = :partnerStateId', {
        partnerStateId: user.partner_state.id,
      })
      .andWhere('MonthlyReport.status != :status', {
        status: MonthlyReportStatus.PENDENTE_ENVIO,
      })
      .andWhere(
        `(MonthlyReport.levelApproveRegistration = '${accessProfile?.role}' OR ${levelValidate})`,
      )
      .andWhere('user.active = TRUE')
      .andWhere('user.id != :userId', { userId: user.id })
      .orderBy('MonthlyReport.updatedAt', 'DESC');

    if (accessProfile?.role === LevelApproveRegistration.MUNICIPIO) {
      queryBuilder.andWhere('user.city = :city', { city: user.city });
    }

    if (accessProfile?.role === LevelApproveRegistration.REGIONAL) {
      queryBuilder.andWhere('user.regionalPartnerId = :regionalPartnerId', {
        regionalPartnerId: user.regionalPartnerId,
      });
    }

    if (search) {
      queryBuilder.andWhere('user.name LIKE :search', {
        search: `%${search}%`,
      });
    }

    if (month) {
      queryBuilder.andWhere('MonthlyReport.month = :month', { month });
    }

    if (status) {
      if (
        !accessProfile?.role ||
        accessProfile.role === LevelApproveRegistration.ESTADO
      ) {
        queryBuilder.andWhere(`(MonthlyReport.status = :statusFilter)`, {
          statusFilter: status,
        });
      } else {
        if (status === MonthlyReportStatus.APROVADO) {
          queryBuilder.andWhere(
            `(${levelValidate} AND MonthlyReport.levelApproveRegistration != :role)`,
            {
              role: accessProfile?.role,
            },
          );
        } else {
          queryBuilder.andWhere(
            `(MonthlyReport.status = :statusFilter AND MonthlyReport.levelApproveRegistration = :role)`,
            {
              statusFilter: status,
              role: accessProfile?.role,
            },
          );
        }
      }
    }

    const data = await paginateData(+page, +limit, queryBuilder);

    const items = data.items.map((item) => {
      let status = item.status;
      if (levelsApprove[accessProfile?.role]) {
        status =
          accessProfile?.role === item.levelApproveRegistration
            ? item.status
            : MonthlyReportStatus.APROVADO;
      }

      return {
        ...item,
        status,
      };
    });

    return {
      ...data,
      items,
    };
  }

  generalSearch(paginationParams: PaginationParamsMonthlyReports, user: User) {
    const { page, limit, search } = paginationParams;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessProfile: any = user?.access_profile;

    const queryBuilder = this.monthlyReportRepository
      .createQueryBuilder('MonthlyReport')
      .select(['MonthlyReport', 'scholar.id', 'user.name'])
      .innerJoin('MonthlyReport.scholar', 'scholar')
      .leftJoin('scholar.user', 'user')
      .where('user.partner_state = :partnerStateId', {
        partnerStateId: user.partner_state.id,
      })

      .andWhere('user.active = TRUE')
      .orderBy('MonthlyReport.updatedAt', 'DESC');

    if (accessProfile?.role === ProfileRole.BOLSISTA) {
      queryBuilder.andWhere('user.id = :userId', { userId: user.id });
    } else {
      queryBuilder
        .andWhere('user.id != :userId', { userId: user.id })
        .andWhere(`MonthlyReport.levelApproveRegistration = :role`, {
          role: accessProfile?.role,
        })
        .andWhere('MonthlyReport.status = :status', {
          status: MonthlyReportStatus.PENDENTE_VALIDACAO,
        });
    }

    if (accessProfile?.role === LevelApproveRegistration.MUNICIPIO) {
      queryBuilder.andWhere('user.city = :city', { city: user.city });
    }

    if (accessProfile?.role === LevelApproveRegistration.REGIONAL) {
      queryBuilder.andWhere('user.regionalPartnerId = :regionalPartnerId', {
        regionalPartnerId: user.regionalPartnerId,
      });
    }

    if (search) {
      queryBuilder.andWhere('user.name LIKE :search', {
        search: `%${search}%`,
      });
    }

    return paginateData(+page, +limit, queryBuilder);
  }

  findAllByScholar(
    paginationParams: PaginationParamsMonthlyReports,
    user: User,
  ) {
    const { page, limit, month, status, year } = paginationParams;

    const queryBuilder = this.monthlyReportRepository
      .createQueryBuilder('MonthlyReport')
      .innerJoin('MonthlyReport.scholar', 'scholar')
      .leftJoin('scholar.user', 'user')
      .where('user.id = :userId', { userId: user.id })
      .orderBy('MonthlyReport.updatedAt', 'DESC');

    if (month) {
      queryBuilder.andWhere('MonthlyReport.month = :month', { month });
    }

    if (year) {
      queryBuilder.andWhere('MonthlyReport.year = :year', { year });
    }

    if (status) {
      queryBuilder.andWhere('MonthlyReport.status = :status', { status });
    }

    return paginateData(page, limit, queryBuilder);
  }

  async findOne(
    id: number,
    relations = [
      'scholar',
      'scholar.user',
      'actionsMonthlyReport',
      'validationHistoryCounty',
      'validationHistoryRegional',
      'validationHistoryState',
      'actionsMonthlyReport.scheduleWorkPlan',
    ],
  ) {
    const monthlyReport = await this.monthlyReportRepository.findOne({
      where: {
        id,
      },
      relations,
    });

    if (!monthlyReport) {
      throw new NotFoundException('Relatório mensal não encontrado');
    }

    const { termOfMembership } =
      await this.termsOfMembershipService.meForReport(
        monthlyReport?.scholar?.userId,
      );

    return {
      monthlyReport,
      termOfMembership,
    };
  }

  async sendForValidation(id: number, user: User): Promise<void> {
    const { monthlyReport } = await this.findOne(id, []);

    if (!monthlyReport) {
      throw new NotFoundException();
    }

    if (monthlyReport.status !== MonthlyReportStatus.PENDENTE_ENVIO) {
      throw new ForbiddenError();
    }

    try {
      await this.monthlyReportRepository.update(monthlyReport.id, {
        status: MonthlyReportStatus.PENDENTE_VALIDACAO,
      });
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async inValidation(id: number, user: User): Promise<void> {
    const { monthlyReport } = await this.findOne(id, [
      'scholar',
      'scholar.user',
    ]);

    await this.systemParametersService.verifyLimitAnalysisMonthlyReport(
      user.partnerStateId,
      monthlyReport.createdAt,
    );

    if (monthlyReport.scholar.user.id === user.id) {
      throw new ForbiddenError();
    }

    if (monthlyReport.status !== MonthlyReportStatus.PENDENTE_VALIDACAO) {
      throw new ForbiddenError();
    }

    try {
      await this.monthlyReportRepository.update(monthlyReport.id, {
        status: MonthlyReportStatus.EM_VALIDACAO,
      });
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async approve(id: number, user: User): Promise<void> {
    const { monthlyReport } = await this.findOne(id, [
      'scholar',
      'scholar.user',
    ]);

    await this.systemParametersService.verifyLimitAnalysisMonthlyReport(
      user.partnerStateId,
      monthlyReport.createdAt,
    );

    if (monthlyReport.scholar.user.id === user.id) {
      throw new ForbiddenError();
    }

    const accessProfileRole: string = user?.access_profile?.role;
    const statusApprove = [
      MonthlyReportStatus.EM_VALIDACAO,
      MonthlyReportStatus.PENDENTE_VALIDACAO,
    ];

    if (
      !statusApprove.includes(monthlyReport.status) ||
      monthlyReport.levelApproveRegistration !== accessProfileRole
    ) {
      throw new ForbiddenError();
    }

    const validationHistory = await this.validationHistoryRepository
      .create({
        user,
        status: MonthlyReportStatus.APROVADO,
      })
      .save();

    if (
      monthlyReport.levelApproveRegistration ===
      LevelApproveRegistration.MUNICIPIO
    ) {
      monthlyReport.validationHistoryCounty = validationHistory;
      monthlyReport.levelApproveRegistration =
        LevelApproveRegistration.REGIONAL;
      monthlyReport.status = MonthlyReportStatus.PENDENTE_VALIDACAO;
    } else if (
      monthlyReport.levelApproveRegistration ===
      LevelApproveRegistration.REGIONAL
    ) {
      monthlyReport.validationHistoryRegional = validationHistory;
      monthlyReport.levelApproveRegistration = LevelApproveRegistration.ESTADO;
      monthlyReport.status = MonthlyReportStatus.PENDENTE_VALIDACAO;
    } else {
      monthlyReport.validationHistoryState = validationHistory;
      monthlyReport.status = MonthlyReportStatus.APROVADO;
    }

    try {
      await this.monthlyReportRepository.save({
        ...monthlyReport,
        validationAt: new Date(),
      });
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async reprove(
    id: number,
    reproveScholarDto: ReproveMonthlyReport,
    user: User,
  ): Promise<void> {
    const { justification } = reproveScholarDto;
    const { monthlyReport } = await this.findOne(id, [
      'scholar',
      'scholar.user',
    ]);

    await this.systemParametersService.verifyLimitAnalysisMonthlyReport(
      user.partnerStateId,
      monthlyReport.createdAt,
    );

    if (monthlyReport.scholar.user.id === user.id) {
      throw new ForbiddenError();
    }

    const statusReprove = [
      MonthlyReportStatus.EM_VALIDACAO,
      MonthlyReportStatus.PENDENTE_VALIDACAO,
    ];

    const accessProfileRole: string = user?.access_profile?.role;

    if (
      !statusReprove.includes(monthlyReport.status) ||
      monthlyReport.levelApproveRegistration !== accessProfileRole
    ) {
      throw new ForbiddenError();
    }

    const validationHistory = await this.validationHistoryRepository
      .create({
        user,
        justificationReprove: justification,
        status: MonthlyReportStatus.REPROVADO,
      })
      .save();

    if (
      monthlyReport.levelApproveRegistration ===
      LevelApproveRegistration.MUNICIPIO
    ) {
      monthlyReport.validationHistoryCounty = validationHistory;
    } else if (
      monthlyReport.levelApproveRegistration ===
      LevelApproveRegistration.REGIONAL
    ) {
      monthlyReport.validationHistoryRegional = validationHistory;
    } else {
      monthlyReport.validationHistoryState = validationHistory;
    }

    try {
      await this.monthlyReportRepository.save({
        ...monthlyReport,
        status: MonthlyReportStatus.REPROVADO,
      });

      this.notificationsService.reproveMonthlyReport(
        monthlyReport.scholar.user,
      );
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async update(
    id: number,
    updateMonthlyReportDto: UpdateMonthlyReportDto,
    file?: Express.Multer.File,
  ) {
    const { monthlyReport } = await this.findOne(id);

    const { actions } = updateMonthlyReportDto;

    const statusForUpdate = [
      MonthlyReportStatus.REPROVADO,
      MonthlyReportStatus.PENDENTE_VALIDACAO,
      MonthlyReportStatus.PENDENTE_ENVIO,
    ];

    if (!statusForUpdate.includes(monthlyReport.status)) {
      throw new ForbiddenError();
    }

    const fileAction = file ? file.filename : monthlyReport.actionDocument;

    try {
      await this.monthlyReportRepository.update(monthlyReport.id, {
        status: MonthlyReportStatus.PENDENTE_VALIDACAO,
        actionDocument: fileAction,
      });

      await Promise.all(
        actions.map(async (action) => {
          const {
            detailing,
            qntExpectedGraduates,
            qntFormedGifts,
            status,
            scheduleWorkPlanId,
            detailingResult,
            trainingDate,
            trainingModality,
            workloadInMinutes,
          } = action;
          const actionMonthlyReport = monthlyReport.actionsMonthlyReport.find(
            (schedule) => schedule.scheduleWorkPlanId === scheduleWorkPlanId,
          );

          if (actionMonthlyReport) {
            await this.actionMonthlyReportRepository.update(
              actionMonthlyReport.id,
              {
                detailing,
                qntExpectedGraduates,
                qntFormedGifts,
                detailingResult,
                workloadInMinutes,
                status,
                trainingDate,
                trainingModality,
              },
            );

            await this.scheduleWorkPlanRepository.update(scheduleWorkPlanId, {
              status,
            });
          }
        }),
      );
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async remove(id: number, user: User) {
    const { monthlyReport } = await this.findOne(id);

    if (monthlyReport.scholar.user.id !== user.id) {
      throw new ForbiddenError();
    }

    const statusForRemove = [
      MonthlyReportStatus.PENDENTE_VALIDACAO,
      MonthlyReportStatus.PENDENTE_ENVIO,
    ];

    if (!statusForRemove.includes(monthlyReport.status)) {
      throw new ForbiddenError();
    }

    try {
      await Promise.all(
        monthlyReport.actionsMonthlyReport.map(async (action) => {
          await this.scheduleWorkPlanRepository.update(
            action.scheduleWorkPlanId,
            {
              status: StatusActionMonthlyEnum.EM_ANDAMENTO,
            },
          );
        }),
      );

      await this.monthlyReportRepository.remove(monthlyReport, {
        data: user,
      });
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async getDeliveryAverageMonthReportsForIndicator(params: {
    year: number;
    month: number;
    partnerStateId?: number;
    regionalPartnerId?: number;
    city?: string;
  }) {
    const { year, month, partnerStateId, regionalPartnerId, city } = params;

    const queryBuilder = this.monthlyReportRepository
      .createQueryBuilder('MonthlyReport')
      .innerJoin('MonthlyReport.scholar', 'scholar')
      .innerJoin('scholar.user', 'user')
      .where('user.active = TRUE');

    if (year) {
      queryBuilder.andWhere('MonthlyReport.year = :year', { year });
    }

    if (month) {
      queryBuilder.andWhere('MonthlyReport.month = :month', { month });
    }

    if (partnerStateId) {
      queryBuilder.andWhere('user.partnerStateId = :partnerStateId', {
        partnerStateId,
      });
    }

    if (regionalPartnerId) {
      queryBuilder.andWhere('user.regionalPartnerId = :regionalPartnerId', {
        regionalPartnerId,
      });
    }

    if (city) {
      queryBuilder.andWhere('user.city = :city', {
        city,
      });
    }

    const queryBuilderTotalMonthReportsNotPendingShipment = queryBuilder;

    const totalMonthReports = await queryBuilder.getCount();

    const totalMonthReportsNotPendingShipment =
      await queryBuilderTotalMonthReportsNotPendingShipment
        .andWhere(
          `MonthlyReport.status != '${MonthlyReportStatus.PENDENTE_ENVIO}'`,
        )
        .getCount();

    const deliveryAverageMonthReports = totalMonthReports
      ? (
          (totalMonthReportsNotPendingShipment / totalMonthReports) *
          100
        ).toFixed(2)
      : 0;

    return {
      deliveryAverageMonthReports,
    };
  }
}
