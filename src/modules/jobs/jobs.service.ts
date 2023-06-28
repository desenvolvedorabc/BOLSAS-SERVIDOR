import { Injectable } from '@nestjs/common';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Connection } from 'typeorm';
import { getDaysInMonth } from 'date-fns';
import { InjectConnection } from '@nestjs/typeorm';
import { PartnerState } from '../partner-states/entities/partner-state.entity';
import { Scholar } from '../scholars/entities/scholar.entity';
import { MonthlyReport } from '../monthly-reports/entities/monthly-report.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { TermOfMembershipStatus } from '../terms-of-membership/enum/status-term-membership.enum';
import { MonthlyReportStatus } from '../monthly-reports/enum/monthly-report-status.enum';
import { LevelApproveRegistration } from '../monthly-reports/dto/level-approve-registration.enum';
import { User } from '../user/model/entities/user.entity';
import { TermsOfMembership } from '../terms-of-membership/entities/terms-of-membership.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,

    private readonly notificationsService: NotificationsService,
  ) {}

  async inactiveUsersWithExpiredTerms() {
    const date = new Date();

    const termOfMembershipsForInactivate = await this.connection
      .getRepository(TermsOfMembership)
      .createQueryBuilder('TermsOfMemberships')
      .select([
        'TermsOfMemberships.id',
        'TermsOfMemberships.status',
        'TermsOfMemberships.endDate',
        'TermsOfMemberships.extensionDate',
        'scholar.id',
        'scholar.userId',
      ])
      .where('TermsOfMemberships.status IN (:...status)', {
        status: [
          TermOfMembershipStatus.ASSINADO,
          TermOfMembershipStatus.PENDENTE_ASSINATURA,
        ],
      })
      .andWhere(
        '((TermsOfMemberships.endDate <= :date AND TermsOfMemberships.extensionDate IS NULL) OR (TermsOfMemberships.extensionDate <= :date))',
        {
          date,
        },
      )
      .innerJoin('TermsOfMemberships.scholar', 'scholar')
      .getMany();

    await Promise.all(
      termOfMembershipsForInactivate.map(async (termOfMembership) => {
        await this.connection
          .getRepository(TermsOfMembership)
          .update(termOfMembership.id, {
            status: TermOfMembershipStatus.INATIVADO,
          });

        await this.connection
          .getRepository(User)
          .update(termOfMembership.scholar.userId, {
            active: false,
          });
      }),
    );
  }

  async sendNotificationsUsersReportsPending(
    users: User[],
    numberOfDaysLeft: number,
  ): Promise<void> {
    await Promise.all(
      users.map((user) => {
        const message =
          numberOfDaysLeft >= 1
            ? `Olá ${user.name}, verifique se há relatórios mensais para serem validados. Faltam ${numberOfDaysLeft} dia(s) para encerrar o período de validação dos relatórios.`
            : `Olá ${user.name}, verifique se há relatórios mensais para serem validados. Hoje é o ultimo dia para encerrar o período de validação dos relatórios.`;
        this.notificationsService.create({
          title: 'Relatórios Mensais Pendentes Validação.',
          text: message,
          userId: user.id,
          messageId: null,
        });
      }),
    );
  }

  private async getUsersNotificationByRole(
    role: LevelApproveRegistration,
    partnerState: PartnerState,
    params: { year: number; month: number; numberOfDaysLeft: number },
  ) {
    const { month, year, numberOfDaysLeft } = params;

    if (role === LevelApproveRegistration.ESTADO) {
      const verifyExistMonthReport = await this.connection
        .getRepository(MonthlyReport)
        .createQueryBuilder('MonthlyReports')
        .select(['MonthlyReports.id'])
        .innerJoin('MonthlyReports.scholar', 'scholar')
        .innerJoin('scholar.user', 'user')
        .where(
          'MonthlyReports.month = :month AND MonthlyReports.year = :year AND MonthlyReports.status = :status AND MonthlyReports.levelApproveRegistration = :levelApproveRegistration',
          {
            month,
            year,
            status: MonthlyReportStatus.PENDENTE_VALIDACAO,
            levelApproveRegistration: LevelApproveRegistration.ESTADO,
          },
        )
        .andWhere('user.active = TRUE')
        .andWhere('user.partnerStateId = :partnerStateId', {
          partnerStateId: partnerState.id,
        })
        .getOne();

      if (verifyExistMonthReport) {
        const users = await this.connection
          .getRepository(User)
          .createQueryBuilder('Users')
          .select(['Users.id', 'Users.name'])
          .innerJoin('Users.access_profile', 'access_profile')
          .innerJoin('access_profile.areas', 'areas')
          .where('Users.partnerStateId = :partnerStateId', {
            partnerStateId: partnerState.id,
          })
          .andWhere('Users.active = TRUE')
          .andWhere('access_profile.role = :role', {
            role,
          })
          .andWhere('areas.tag = :tag', { tag: 'APRO_REL' })
          .getMany();

        this.sendNotificationsUsersReportsPending(users, numberOfDaysLeft);
      }
    } else {
      const queryBuilderMonthlyReportsPendingByRegional = this.connection
        .getRepository(MonthlyReport)
        .createQueryBuilder('MonthlyReports')
        .select([
          'MonthlyReports.id',
          'scholar.id',
          'user.id',
          'user.regionalPartnerId',
          'user.city',
        ])
        .innerJoin('MonthlyReports.scholar', 'scholar')
        .innerJoin('scholar.user', 'user')
        .groupBy('user.regionalPartnerId')
        .where(
          'MonthlyReports.month = :month AND MonthlyReports.year = :year AND MonthlyReports.status = :status AND MonthlyReports.levelApproveRegistration = :levelApproveRegistration',
          {
            month,
            year,
            status: MonthlyReportStatus.PENDENTE_VALIDACAO,
            levelApproveRegistration: role,
          },
        )
        .andWhere('user.active = TRUE')
        .andWhere('user.partnerStateId = :partnerStateId', {
          partnerStateId: partnerState.id,
        });

      if (role === LevelApproveRegistration.MUNICIPIO) {
        queryBuilderMonthlyReportsPendingByRegional.addGroupBy('user.city');
      }

      const monthlyReportsPendingByRegional =
        await queryBuilderMonthlyReportsPendingByRegional.getRawMany();

      await Promise.all(
        monthlyReportsPendingByRegional.map(async (monthlyReport) => {
          const queryBuilderUsers = this.connection
            .getRepository(User)
            .createQueryBuilder('Users')
            .select(['Users.id', 'Users.name'])
            .innerJoin('Users.access_profile', 'access_profile')
            .innerJoin('access_profile.areas', 'areas')
            .where('Users.partnerStateId = :partnerStateId', {
              partnerStateId: partnerState.id,
            })
            .andWhere('Users.active = TRUE')
            .andWhere('access_profile.role = :role', {
              role,
            })
            .andWhere('Users.regionalPartnerId = :regionalPartnerId', {
              regionalPartnerId: monthlyReport?.user_regionalPartnerId,
            })
            .andWhere('areas.tag = :tag', { tag: 'APRO_REL' });

          if (role === LevelApproveRegistration.MUNICIPIO) {
            queryBuilderUsers.andWhere('Users.city = :city', {
              city: monthlyReport?.user_city,
            });
          }

          const users = await queryBuilderUsers.getMany();

          this.sendNotificationsUsersReportsPending(users, numberOfDaysLeft);
        }),
      );
    }
  }

  async notificationUsersReportsPendingValidation() {
    const partnerStates = await this.connection
      .getRepository(PartnerState)
      .createQueryBuilder('PartnerStates')
      .innerJoinAndSelect('PartnerStates.systemParameter', 'systemParameter')
      .getMany();

    for await (const partnerState of partnerStates) {
      const day = new Date().getDate();
      const dateForMonth = new Date();
      const { dayLimitForMonthlyReport, daysLimitForAnalysisMonthlyReport } =
        partnerState.systemParameter;

      if (day < dayLimitForMonthlyReport) {
        dateForMonth.setMonth(dateForMonth.getMonth() - 1);
      }

      const month = dateForMonth.getMonth();
      const year = dateForMonth.getFullYear();

      const totalDaysInMonth = getDaysInMonth(dateForMonth);

      const dayLimitForMonthlyReportOfTheMonth =
        totalDaysInMonth <= dayLimitForMonthlyReport
          ? totalDaysInMonth
          : dayLimitForMonthlyReport;

      const dateFormatted = new Date(
        year,
        month,
        dayLimitForMonthlyReportOfTheMonth,
      );

      const differenceTotalInDays = differenceInDays(new Date(), dateFormatted);

      if (differenceTotalInDays <= daysLimitForAnalysisMonthlyReport) {
        const numberOfDaysLeft =
          daysLimitForAnalysisMonthlyReport - differenceTotalInDays;

        const roles = [
          LevelApproveRegistration.MUNICIPIO,
          LevelApproveRegistration.REGIONAL,
          LevelApproveRegistration.ESTADO,
        ];

        for (const role of roles) {
          await this.getUsersNotificationByRole(role, partnerState, {
            year,
            month: month + 1,
            numberOfDaysLeft,
          });
        }
      }
    }
  }

  async notificationScholarsReportsPending() {
    const partnerStates = await this.connection
      .getRepository(PartnerState)
      .createQueryBuilder('PartnerStates')
      .innerJoinAndSelect('PartnerStates.systemParameter', 'systemParameter')
      .getMany();

    const day = new Date().getDate();
    const month = new Date().getMonth() + 1;
    const nameMonth = format(new Date(), 'MMMM', {
      locale: ptBR,
    });

    const year = new Date().getFullYear();
    const totalDaysInMonth = getDaysInMonth(new Date());

    for await (const partnerState of partnerStates) {
      const {
        dayLimitForMonthlyReport,
        daysLimitSendNotificationForMonthlyReport,
      } = partnerState.systemParameter;

      const dayLimitForMonthlyReportOfTheMonth =
        totalDaysInMonth <= dayLimitForMonthlyReport
          ? totalDaysInMonth
          : dayLimitForMonthlyReport;

      const dayInitialNotification =
        dayLimitForMonthlyReportOfTheMonth -
        daysLimitSendNotificationForMonthlyReport;

      const numberOfDaysLeft = dayLimitForMonthlyReportOfTheMonth - day;

      if (
        day >= dayInitialNotification &&
        day <= dayLimitForMonthlyReportOfTheMonth
      ) {
        const scholars = await this.connection
          .getRepository(Scholar)
          .createQueryBuilder('Scholars')
          .select(['Scholars.id', 'user.id', 'user.name'])
          .innerJoin('Scholars.user', 'user')
          .innerJoin('Scholars.termOfMembership', 'termOfMembership')
          .where('user.partnerStateId = :partnerStateId', {
            partnerStateId: partnerState.id,
          })
          .andWhere('termOfMembership.status = :status', {
            status: TermOfMembershipStatus.ASSINADO,
          })
          .andWhere('user.active = TRUE')
          .getMany();

        await Promise.all(
          scholars.map(async (scholar) => {
            const verifyExistMonthReport = await this.connection
              .getRepository(MonthlyReport)
              .findOne({
                where: {
                  month,
                  year,
                  scholarId: scholar.id,
                },
              });

            if (!verifyExistMonthReport) {
              const message =
                numberOfDaysLeft >= 1
                  ? `Olá ${scholar.user.name}, faltam ${numberOfDaysLeft} dias para enviar seu relatório mensal do mês de ${nameMonth}.`
                  : `Olá ${scholar.user.name}, hoje é o ultimo dia para enviar seu relatório mensal do mês de ${nameMonth}.`;
              this.notificationsService.create({
                title: 'Relatórios Mensais Pendentes.',
                text: message,
                userId: scholar.user.id,
                messageId: null,
              });
            }
          }),
        );
      }
    }
  }
}
