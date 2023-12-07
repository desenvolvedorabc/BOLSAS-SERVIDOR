import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, Not } from 'typeorm';
import { differenceInMonths } from 'date-fns';
import { MonthlyReport } from 'src/modules/monthly-reports/entities/monthly-report.entity';
import { MonthlyReportStatus } from 'src/modules/monthly-reports/enum/monthly-report-status.enum';
import { PartnerState } from 'src/modules/partner-states/entities/partner-state.entity';
import { TermsOfMembership } from 'src/modules/terms-of-membership/entities/terms-of-membership.entity';
import { TermOfMembershipStatus } from 'src/modules/terms-of-membership/enum/status-term-membership.enum';
import { User } from 'src/modules/user/model/entities/user.entity';
import { SubCredentialRole } from 'src/modules/user/model/enum/sub-role.enum';
import { RegionalPartner } from 'src/modules/regional-partners/entities/regional-partner.entity';
import { ParamsSystemIndicatorDto } from '../dto/params-system-indicator.dto';
import { ProfileRole } from 'src/modules/profile/model/enum/profile-role';
import { MonthlyReportsService } from 'src/modules/monthly-reports/monthly-reports.service';
import { LevelApproveRegistration } from 'src/modules/monthly-reports/dto/level-approve-registration.enum';
import { Scholar } from 'src/modules/scholars/entities/scholar.entity';
import { StatusRegistration } from 'src/modules/scholars/enum/status-registration.enum';
import { WorkPlan } from 'src/modules/work-plans/entities/work-plan.entity';
import { WorkPlanStatus } from 'src/modules/work-plans/enum/work-plan-status.enum';
import { BankRemittance } from 'src/modules/bank-remittances/entities/bank-remittance.entity';
import { ActionMonthlyReport } from 'src/modules/monthly-reports/entities/action-monthly-report.entity';
import { StatusActionMonthlyEnum } from 'src/modules/monthly-reports/enum/status-action-monthly.enum';

@Injectable()
export class SystemIndicatorsStateService {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,

    private readonly monthlyReportsService: MonthlyReportsService,
  ) {}

  private validateUserIsScholar(user: User) {
    if (user?.access_profile?.role === ProfileRole.BOLSISTA) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar os indicadores.',
      );
    }
  }

  private validateRoleProfile(
    user: User,
    regionalPartnerId?: number,
    city?: string,
    cities?: string[],
  ) {
    const partnerStateId = user.partnerStateId;

    let regionalPartnerIdForFilter = regionalPartnerId;
    let cityForFilter = city;
    let citiesForFilter = cities;

    const profilesCity = [ProfileRole.MUNICIPIO, ProfileRole.BOLSISTA];

    if (profilesCity.includes(user?.access_profile?.role)) {
      cityForFilter = user.city;
      citiesForFilter = [user.city];
      regionalPartnerIdForFilter = user.regionalPartnerId;
    } else if (user?.access_profile?.role === ProfileRole.REGIONAL) {
      regionalPartnerIdForFilter = user.regionalPartnerId;
    }

    return {
      partnerStateId,
      regionalPartnerIdForFilter,
      cityForFilter,
      citiesForFilter,
    };
  }

  async macroIndicatorsGeneral(user: User) {
    const {
      partnerStateId,
      regionalPartnerIdForFilter: regionalPartnerId,
      cityForFilter: city,
    } = this.validateRoleProfile(user, null, null, null);

    const { totalScholars } = await this.getScholars(
      null,
      partnerStateId,
      regionalPartnerId,
      city,
    );

    const { deliveryAverageMonthReports } =
      await this.monthlyReportsService.getDeliveryAverageMonthReportsForIndicator(
        {
          year: null,
          month: null,
          partnerStateId,
          regionalPartnerId,
          city,
        },
      );

    return {
      totalScholars,
      deliveryAverageMonthReports,
    };
  }

  private async getRegionalPartners(partnerStateId: number) {
    const connectionOn = this.connection;

    const regionalPartners = await connectionOn
      .getRepository(RegionalPartner)
      .find({
        select: ['id', 'name'],
        where: {
          active: true,
          partnerStateId,
        },
      });

    return {
      regionalPartners,
    };
  }

  private async getScholars(
    year: number,
    partnerStateId?: number,
    regionalPartnerId?: number,
    city?: string,
  ) {
    const queryBuilder = await this.connection
      .getRepository(User)
      .createQueryBuilder('Users')
      .where('Users.subRole = :subRole', {
        subRole: SubCredentialRole.BOLSISTA,
      })
      .andWhere('Users.active = TRUE');

    if (year) {
      queryBuilder.andWhere('YEAR(Users.createdAt) = :year', { year });
    }

    if (partnerStateId) {
      queryBuilder.andWhere('Users.partnerStateId = :partnerStateId', {
        partnerStateId,
      });
    }

    if (regionalPartnerId) {
      queryBuilder.andWhere('Users.regionalPartnerId = :regionalPartnerId', {
        regionalPartnerId,
      });
    }

    if (city) {
      queryBuilder.andWhere('Users.city = :city', {
        city,
      });
    }

    const totalScholars = await queryBuilder.getCount();

    return {
      totalScholars,
    };
  }

  async getScholarsForIndicator(
    paramsSystemIndicator: ParamsSystemIndicatorDto,
    user: User,
  ) {
    const { year, regionalPartnerId, cities } = paramsSystemIndicator;

    this.validateUserIsScholar(user);

    const { partnerStateId, regionalPartnerIdForFilter, citiesForFilter } =
      this.validateRoleProfile(user, regionalPartnerId, null, cities);

    const connectionOn = this.connection;

    if (citiesForFilter?.length) {
      const data = await Promise.all(
        citiesForFilter.map(async (city) => {
          const { totalScholars } = await this.getScholars(
            year,
            partnerStateId,
            regionalPartnerIdForFilter,
            city,
          );

          return {
            city,
            totalScholars,
          };
        }),
      );

      return {
        data,
      };
    } else if (regionalPartnerIdForFilter) {
      const regionalPartner = await connectionOn
        .getRepository(RegionalPartner)
        .findOne({
          where: {
            id: regionalPartnerIdForFilter,
          },
        });

      const data = await Promise.all(
        regionalPartner.cities.map(async (city) => {
          const { totalScholars } = await this.getScholars(
            year,
            partnerStateId,
            regionalPartner.id,
            city,
          );

          return {
            city,
            totalScholars,
          };
        }),
      );

      return {
        data,
      };
    } else if (partnerStateId) {
      const { regionalPartners } = await this.getRegionalPartners(
        partnerStateId,
      );

      const data = await Promise.all(
        regionalPartners.map(async (regionalPartner) => {
          const { totalScholars } = await this.getScholars(
            year,
            partnerStateId,
            regionalPartner.id,
            null,
          );

          return {
            ...regionalPartner,
            totalScholars,
          };
        }),
      );

      return {
        data,
      };
    }
  }

  private async getAverageValueOfTerms(
    year: number,
    partnerStateId?: number,
    regionalPartnerId?: number,
    city?: string,
  ) {
    const connectionOn = this.connection.getRepository(TermsOfMembership);

    const queryBuilder = connectionOn
      .createQueryBuilder('TermsOfMembership')
      .select(
        'SUM(TermsOfMembership.scholarshipValueInCents)',
        'totalScholarshipValueInCents',
      )
      .addSelect('COUNT(TermsOfMembership.id)', 'totalTermsOfMembership')
      .innerJoin('TermsOfMembership.scholar', 'scholar')
      .innerJoin('scholar.user', 'user')
      .where('user.active = TRUE')
      .andWhere('YEAR(user.createdAt) = :year', { year })
      .andWhere('TermsOfMembership.status = :status', {
        status: TermOfMembershipStatus.ASSINADO,
      });

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

    const { totalScholarshipValueInCents, totalTermsOfMembership } =
      await queryBuilder.getRawOne();

    const formattedTotalScholarshipValueInCents =
      Number(totalScholarshipValueInCents) ?? 0;

    const averageValueOfBagsInCents =
      formattedTotalScholarshipValueInCents / Number(totalTermsOfMembership);

    return {
      averageValueOfBagsInCents: averageValueOfBagsInCents
        ? averageValueOfBagsInCents
        : 0,
    };
  }

  async getAverageValueTermsForIndicator(
    paramsSystemIndicator: ParamsSystemIndicatorDto,
    user: User,
  ) {
    const { year, regionalPartnerId, cities } = paramsSystemIndicator;

    this.validateUserIsScholar(user);

    const { partnerStateId, regionalPartnerIdForFilter, citiesForFilter } =
      this.validateRoleProfile(user, regionalPartnerId, null, cities);

    const connectionOn = this.connection;

    if (citiesForFilter?.length) {
      const data = await Promise.all(
        citiesForFilter.map(async (city) => {
          const { averageValueOfBagsInCents } =
            await this.getAverageValueOfTerms(
              year,
              partnerStateId,
              regionalPartnerIdForFilter,
              city,
            );

          return {
            city,
            averageValueOfBagsInCents,
          };
        }),
      );

      return {
        data,
      };
    } else if (regionalPartnerIdForFilter) {
      const regionalPartner = await connectionOn
        .getRepository(RegionalPartner)
        .findOne({
          where: {
            id: regionalPartnerIdForFilter,
          },
        });

      const data = await Promise.all(
        regionalPartner.cities.map(async (city) => {
          const { averageValueOfBagsInCents } =
            await this.getAverageValueOfTerms(
              year,
              partnerStateId,
              regionalPartner.id,
              city,
            );

          return {
            city,
            averageValueOfBagsInCents,
          };
        }),
      );

      return {
        data,
      };
    } else if (partnerStateId) {
      const { regionalPartners } = await this.getRegionalPartners(
        partnerStateId,
      );

      const data = await Promise.all(
        regionalPartners.map(async (regionalPartner) => {
          const { averageValueOfBagsInCents } =
            await this.getAverageValueOfTerms(
              year,
              partnerStateId,
              regionalPartner.id,
              null,
            );

          return {
            ...regionalPartner,
            averageValueOfBagsInCents,
          };
        }),
      );

      return {
        data,
      };
    }
  }

  private async getTermsToValidateStay(
    year: number,
    partnerStateId?: number,
    regionalPartnerId?: number,
    city?: string,
  ) {
    const connectionOn = this.connection.getRepository(TermsOfMembership);

    const queryBuilder = connectionOn
      .createQueryBuilder('TermsOfMembership')
      .select([
        'TermsOfMembership.id',
        'TermsOfMembership.endDate',
        'TermsOfMembership.startDate',
        'TermsOfMembership.extensionDate',
      ])
      .innerJoin('TermsOfMembership.scholar', 'scholar')
      .innerJoin('scholar.user', 'user')
      .where('user.active = TRUE')
      .andWhere('YEAR(user.createdAt) = :year', { year })
      .andWhere('TermsOfMembership.status = :status', {
        status: TermOfMembershipStatus.ASSINADO,
      });

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

    const terms = await queryBuilder.getMany();

    const formattedTerms = terms.map((term) => {
      const finalDate = term.extensionDate ?? term.endDate;
      const difference = differenceInMonths(finalDate, term.startDate);
      return {
        ...term,
        difference,
      };
    });

    const totalMonthsOfTerms = formattedTerms.reduce((acc, cur) => {
      return acc + cur.difference;
    }, 0);

    const averageMonthsOfTerms = terms.length
      ? totalMonthsOfTerms / terms.length
      : 0;

    return {
      averageMonthsOfTerms,
      totalMonthsOfTerms,
      terms,
    };
  }

  async getTermsToValidateStayForIndicator(
    paramsSystemIndicator: ParamsSystemIndicatorDto,
  ) {
    const { year, partnerStateId, regionalPartnerId, cities } =
      paramsSystemIndicator;

    const connectionOn = this.connection;

    if (cities?.length) {
      const data = await Promise.all(
        cities.map(async (city) => {
          const { averageMonthsOfTerms } = await this.getTermsToValidateStay(
            year,
            null,
            regionalPartnerId,
            city,
          );

          return {
            city,
            averageMonthsOfTerms,
          };
        }),
      );

      return {
        data,
      };
    } else if (regionalPartnerId) {
      const regionalPartner = await connectionOn
        .getRepository(RegionalPartner)
        .findOne({
          where: {
            id: regionalPartnerId,
          },
        });

      const data = await Promise.all(
        regionalPartner.cities.map(async (city) => {
          const { averageMonthsOfTerms } = await this.getTermsToValidateStay(
            year,
            null,
            regionalPartner.id,
            city,
          );

          return {
            city,
            averageMonthsOfTerms,
          };
        }),
      );

      return {
        data,
      };
    } else if (partnerStateId) {
      const { regionalPartners } = await this.getRegionalPartners(
        partnerStateId,
      );

      const data = await Promise.all(
        regionalPartners.map(async (regionalPartner) => {
          const { averageMonthsOfTerms } = await this.getTermsToValidateStay(
            year,
            null,
            regionalPartner.id,
            null,
          );

          return {
            ...regionalPartner,
            averageMonthsOfTerms,
          };
        }),
      );

      return {
        data,
      };
    }
  }

  async getTotalMonthReportsByStatus(params: {
    year: number;
    month: number;
    status: MonthlyReportStatus;
    partnerStateId?: number;
    regionalPartnerId?: number;
    city?: string;
  }) {
    const connectionOn = this.connection;
    const { year, month, status, partnerStateId, regionalPartnerId, city } =
      params;

    const queryBuilder = connectionOn
      .getRepository(MonthlyReport)
      .createQueryBuilder('MonthlyReport')
      .innerJoin('MonthlyReport.scholar', 'scholar')
      .innerJoin('scholar.user', 'user')
      .where('MonthlyReport.status = :status', { status })
      .andWhere('user.active = TRUE');

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

    const total = await queryBuilder.getCount();

    return {
      total,
    };
  }

  async getTotalMonthReportsByStatusForIndicator(
    paramsSystemIndicator: ParamsSystemIndicatorDto,
    user: User,
  ) {
    const { year, month, status, regionalPartnerId, cities } =
      paramsSystemIndicator;

    this.validateUserIsScholar(user);

    const { partnerStateId, regionalPartnerIdForFilter, citiesForFilter } =
      this.validateRoleProfile(user, regionalPartnerId, null, cities);

    const connectionOn = this.connection;

    if (citiesForFilter?.length) {
      const data = await Promise.all(
        citiesForFilter.map(async (city) => {
          const data = await this.getTotalMonthReportsByStatus({
            year,
            month,
            status,
            partnerStateId,
            regionalPartnerId: regionalPartnerIdForFilter,
            city,
          });

          return {
            city,
            ...data,
          };
        }),
      );

      return {
        data,
      };
    } else if (regionalPartnerIdForFilter) {
      const regionalPartner = await connectionOn
        .getRepository(RegionalPartner)
        .findOne({
          where: {
            id: regionalPartnerIdForFilter,
          },
        });

      const data = await Promise.all(
        regionalPartner.cities.map(async (city) => {
          const data = await this.getTotalMonthReportsByStatus({
            year,
            month,
            status,
            partnerStateId,
            regionalPartnerId: regionalPartner.id,
            city,
          });

          return {
            city,
            ...data,
          };
        }),
      );

      return {
        data,
      };
    } else if (partnerStateId) {
      const { regionalPartners } = await this.getRegionalPartners(
        partnerStateId,
      );

      const data = await Promise.all(
        regionalPartners.map(async (regionalPartner) => {
          const data = await this.getTotalMonthReportsByStatus({
            year,
            month,
            status,
            partnerStateId,
            regionalPartnerId: regionalPartner.id,
          });

          return {
            ...regionalPartner,
            ...data,
          };
        }),
      );

      return {
        data,
      };
    }
  }

  private async getScholarsPendingShipmentRegister(
    year: number,
    partnerStateId?: number,
    regionalPartnerId?: number,
    city?: string,
  ) {
    const queryBuilder = this.connection
      .getRepository(Scholar)
      .createQueryBuilder('Scholars')
      .innerJoin('Scholars.user', 'user')
      .where('Scholars.statusRegistration = :statusRegistration', {
        statusRegistration: StatusRegistration.PENDENTE_ENVIO,
      })
      .andWhere('user.subRole = :subRole', {
        subRole: SubCredentialRole.BOLSISTA,
      })
      .andWhere('user.active = TRUE');

    if (year) {
      queryBuilder.andWhere('YEAR(Scholars.createdAt) = :year', { year });
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

    const totalScholars = await queryBuilder.getCount();

    return {
      totalScholars,
    };
  }

  async getScholarsPendingShipmentRegisterForIndicator(
    paramsSystemIndicator: ParamsSystemIndicatorDto,
    user: User,
  ) {
    const { year, regionalPartnerId, cities } = paramsSystemIndicator;

    this.validateUserIsScholar(user);

    const { partnerStateId, regionalPartnerIdForFilter, citiesForFilter } =
      this.validateRoleProfile(user, regionalPartnerId, null, cities);

    const connectionOn = this.connection;

    if (citiesForFilter?.length) {
      const data = await Promise.all(
        citiesForFilter.map(async (city) => {
          const { totalScholars } =
            await this.getScholarsPendingShipmentRegister(
              year,
              partnerStateId,
              regionalPartnerIdForFilter,
              city,
            );

          return {
            city,
            totalScholars,
          };
        }),
      );

      return {
        data,
      };
    } else if (regionalPartnerIdForFilter) {
      const regionalPartner = await connectionOn
        .getRepository(RegionalPartner)
        .findOne({
          where: {
            id: regionalPartnerIdForFilter,
          },
        });

      const data = await Promise.all(
        regionalPartner.cities.map(async (city) => {
          const { totalScholars } =
            await this.getScholarsPendingShipmentRegister(
              year,
              partnerStateId,
              regionalPartner.id,
              city,
            );

          return {
            city,
            totalScholars,
          };
        }),
      );

      return {
        data,
      };
    } else if (partnerStateId) {
      const { regionalPartners } = await this.getRegionalPartners(
        partnerStateId,
      );

      const data = await Promise.all(
        regionalPartners.map(async (regionalPartner) => {
          const { totalScholars } =
            await this.getScholarsPendingShipmentRegister(
              year,
              partnerStateId,
              regionalPartner.id,
              null,
            );

          return {
            ...regionalPartner,
            totalScholars,
          };
        }),
      );

      return {
        data,
      };
    }
  }

  private async getWorksPlansPendingShipment(
    year: number,
    partnerStateId?: number,
    regionalPartnerId?: number,
    city?: string,
  ) {
    const queryBuilder = this.connection
      .getRepository(WorkPlan)
      .createQueryBuilder('WorkPlans')
      .innerJoin('WorkPlans.scholar', 'user')
      .where('WorkPlans.status = :status', {
        status: WorkPlanStatus.PENDENTE_ENVIO,
      })
      .andWhere('user.subRole = :subRole', {
        subRole: SubCredentialRole.BOLSISTA,
      })
      .andWhere('user.active = TRUE');

    if (year) {
      queryBuilder.andWhere('YEAR(WorkPlans.createdAt) = :year', { year });
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

    const total = await queryBuilder.getCount();

    return {
      total,
    };
  }

  async getWorksPlansPendingShipmentForIndicator(
    paramsSystemIndicator: ParamsSystemIndicatorDto,
    user: User,
  ) {
    const { year, regionalPartnerId, cities } = paramsSystemIndicator;

    this.validateUserIsScholar(user);

    const { partnerStateId, regionalPartnerIdForFilter, citiesForFilter } =
      this.validateRoleProfile(user, regionalPartnerId, null, cities);

    const connectionOn = this.connection;

    if (citiesForFilter?.length) {
      const data = await Promise.all(
        citiesForFilter.map(async (city) => {
          const { total } = await this.getWorksPlansPendingShipment(
            year,
            partnerStateId,
            regionalPartnerIdForFilter,
            city,
          );

          return {
            city,
            total,
          };
        }),
      );

      return {
        data,
      };
    } else if (regionalPartnerIdForFilter) {
      const regionalPartner = await connectionOn
        .getRepository(RegionalPartner)
        .findOne({
          where: {
            id: regionalPartnerIdForFilter,
          },
        });

      const data = await Promise.all(
        regionalPartner.cities.map(async (city) => {
          const { total } = await this.getWorksPlansPendingShipment(
            year,
            partnerStateId,
            regionalPartner.id,
            city,
          );

          return {
            city,
            total,
          };
        }),
      );

      return {
        data,
      };
    } else if (partnerStateId) {
      const { regionalPartners } = await this.getRegionalPartners(
        partnerStateId,
      );

      const data = await Promise.all(
        regionalPartners.map(async (regionalPartner) => {
          const { total } = await this.getWorksPlansPendingShipment(
            year,
            partnerStateId,
            regionalPartner.id,
            null,
          );

          return {
            ...regionalPartner,
            total,
          };
        }),
      );

      return {
        data,
      };
    }
  }

  private async getAmountInvestedInScholarship(params: {
    partnerStateId?: number;
    regionalPartnerId?: number;
    city?: string;
    initialDate?: Date;
    finalDate?: Date;
  }) {
    const { partnerStateId, regionalPartnerId, city, initialDate, finalDate } =
      params;

    const queryBuilder = this.connection
      .getRepository(BankRemittance)
      .createQueryBuilder('BankRemittances')
      .select(
        'SUM(BankRemittances.scholarshipValueInCents)',
        'totalScholarshipValueInCents',
      )
      .innerJoin('BankRemittances.monthlyReport', 'monthlyReport')
      .innerJoin('monthlyReport.scholar', 'scholar')
      .innerJoin('scholar.user', 'user')
      .where('monthlyReport.status = :status', {
        status: MonthlyReportStatus.APROVADO,
      });

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

    if (initialDate) {
      const formattedInitialDate = new Date(initialDate);

      formattedInitialDate.setUTCHours(0, 0, 0, 0);

      queryBuilder.andWhere('monthlyReport.createdAt >= :initialDate', {
        initialDate: formattedInitialDate,
      });
    }

    if (finalDate) {
      const formattedFinalDate = new Date(finalDate);

      formattedFinalDate.setUTCHours(23, 59, 59, 999);

      queryBuilder.andWhere('monthlyReport.createdAt <= :finalDate', {
        finalDate: formattedFinalDate,
      });
    }

    const { totalScholarshipValueInCents } = await queryBuilder.getRawOne();

    return {
      totalScholarshipValueInCents: totalScholarshipValueInCents
        ? Number(totalScholarshipValueInCents)
        : 0,
    };
  }

  async amountInvestedInScholarship(
    paramsSystemIndicator: ParamsSystemIndicatorDto,
    user: User,
  ) {
    const { regionalPartnerId, cities, initialDate, finalDate } =
      paramsSystemIndicator;

    this.validateUserIsScholar(user);

    const { partnerStateId, regionalPartnerIdForFilter, citiesForFilter } =
      this.validateRoleProfile(user, regionalPartnerId, null, cities);

    const connectionOn = this.connection;

    if (citiesForFilter?.length) {
      const data = await Promise.all(
        citiesForFilter.map(async (city) => {
          const dataRemittances = await this.getAmountInvestedInScholarship({
            partnerStateId,
            regionalPartnerId: regionalPartnerIdForFilter,
            city,
            initialDate,
            finalDate,
          });

          return {
            city,
            ...dataRemittances,
          };
        }),
      );

      return {
        data,
      };
    } else if (regionalPartnerIdForFilter) {
      const regionalPartner = await connectionOn
        .getRepository(RegionalPartner)
        .findOne({
          where: {
            id: regionalPartnerIdForFilter,
          },
        });

      const data = await Promise.all(
        regionalPartner.cities.map(async (city) => {
          const dataRemittances = await this.getAmountInvestedInScholarship({
            partnerStateId,
            regionalPartnerId: regionalPartner.id,
            city,
            initialDate,
            finalDate,
          });

          return {
            city,
            ...dataRemittances,
          };
        }),
      );

      return {
        data,
      };
    } else if (partnerStateId) {
      const { regionalPartners } = await this.getRegionalPartners(
        partnerStateId,
      );

      const data = await Promise.all(
        regionalPartners.map(async (regionalPartner) => {
          const dataRemittances = await this.getAmountInvestedInScholarship({
            partnerStateId,
            regionalPartnerId: regionalPartner.id,
            city: null,
            initialDate,
            finalDate,
          });

          return {
            ...regionalPartner,
            ...dataRemittances,
          };
        }),
      );

      return {
        data,
      };
    }
  }

  private async getTotalTrainedTeachers(params: {
    year?: number;
    partnerStateId?: number;
    regionalPartnerId?: number;
    city?: string;
  }) {
    const { year, partnerStateId, regionalPartnerId, city } = params;

    const queryBuilder = this.connection
      .getRepository(ActionMonthlyReport)
      .createQueryBuilder('ActionMonthlyReport')
      .select(
        'SUM(ActionMonthlyReport.qntExpectedGraduates)',
        'totalExpectedGraduates',
      )
      .addSelect('SUM(ActionMonthlyReport.qntFormedGifts)', 'totalFormedGifts')
      .innerJoinAndSelect('ActionMonthlyReport.monthlyReport', 'monthlyReport')
      .innerJoin('monthlyReport.scholar', 'scholar')
      .innerJoin('scholar.user', 'user')
      .where(
        `ActionMonthlyReport.status = '${StatusActionMonthlyEnum.CONCLUIDO}'`,
      )
      .andWhere('user.active = TRUE');

    if (year) {
      queryBuilder.andWhere('YEAR(monthlyReport.createdAt) = :year', { year });
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

    let { totalExpectedGraduates, totalFormedGifts } =
      await queryBuilder.getRawOne();

    totalExpectedGraduates = +totalExpectedGraduates ?? 0;
    totalFormedGifts = +totalFormedGifts ?? 0;

    return {
      totalExpectedGraduates,
      totalFormedGifts,
    };
  }

  async getTotalTrainedTeachersMonths({ year, partnerStateIds, regionalPartnerIds, cities, months }) {
    const queryBuilder = this.connection
      .getRepository(ActionMonthlyReport)
      .createQueryBuilder('ActionMonthlyReport')
      .select('monthlyReport.month', 'month')
      .addSelect(
        'COALESCE(SUM(ActionMonthlyReport.qntExpectedGraduates), 0)',
        'totalExpectedGraduates',
      )
      .addSelect('COALESCE(SUM(ActionMonthlyReport.qntFormedGifts), 0)', 'totalFormedGifts')
      .innerJoin('ActionMonthlyReport.monthlyReport', 'monthlyReport')
      .innerJoin('monthlyReport.scholar', 'scholar')
      .innerJoin('scholar.user', 'user')
      .where(
        `ActionMonthlyReport.status = '${StatusActionMonthlyEnum.CONCLUIDO}'`,
      )
      .andWhere('user.active = TRUE')
      .andWhere('monthlyReport.year = :year', { year })

      let regionalPartners = [];

      if (partnerStateIds && partnerStateIds.length > 0) {
        queryBuilder.andWhere('user.partnerStateId IN (:...partnerStateIds)', { partnerStateIds });

        regionalPartners = await this.connection
        .getRepository(RegionalPartner)
        .createQueryBuilder('RegionalPartner')
        .select('RegionalPartner.id', 'id')
        .addSelect('RegionalPartner.name', 'name')
        .where('RegionalPartner.partnerStateId IN (:...partnerStateIds)', { partnerStateIds })
        .andWhere('RegionalPartner.active = 1')
        .getRawMany();

      }

      let citiesByRegionalPartner = [];

      if (regionalPartnerIds && regionalPartnerIds.length > 0) {
        queryBuilder.andWhere('user.regionalPartnerId IN (:...regionalPartnerIds)', { regionalPartnerIds });

        citiesByRegionalPartner = await this.connection
        .getRepository(RegionalPartner)
        .createQueryBuilder('RegionalPartner')
        .select('RegionalPartner.id', 'RegionalPartnerId')
        .addSelect('RegionalPartner.cities', 'cities')        
        .where('RegionalPartner.id IN (:...regionalPartnerIds)', { regionalPartnerIds })
        .andWhere('RegionalPartner.active = 1')
        .getRawMany();
      }
      if (cities && cities.length > 0) {
        queryBuilder.andWhere('user.city IN (:...cities)', { cities });
      }
      if (months && months.length > 0) {
        queryBuilder.andWhere('monthlyReport.month IN (:...months)', { months });
      }

      queryBuilder.groupBy('month');
  
    const result = await queryBuilder.getRawMany();

    const monthsInPortuguese = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
  
     result.forEach(item => {
      item.month_extense = monthsInPortuguese[item.month - 1];
    });
    
    const allMonths = monthsInPortuguese.map((month, index) => {
      const monthData = result.find(item => item.month === index + 1);
      if (monthData) {
        return monthData;
      } else {
        return {
          month: index + 1,
          totalExpectedGraduates: "0",
          totalFormedGifts: "0",
          month_extense: month
        };
      }
    });

    return {
      regionalPartner: regionalPartners,
      citiesByRegionalPartner: citiesByRegionalPartner,
      data: allMonths
    };
  }

  async trainedTeachers(
    paramsSystemIndicator: ParamsSystemIndicatorDto,
    user: User,
  ) {
    const { year, regionalPartnerId, cities } = paramsSystemIndicator;

    this.validateUserIsScholar(user);

    const { partnerStateId, regionalPartnerIdForFilter, citiesForFilter } =
      this.validateRoleProfile(user, regionalPartnerId, null, cities);

    const connectionOn = this.connection;

    if (citiesForFilter?.length) {
      const data = await Promise.all(
        citiesForFilter.map(async (city) => {
          const dataRemittances = await this.getTotalTrainedTeachers({
            year,
            partnerStateId,
            regionalPartnerId: regionalPartnerIdForFilter,
            city,
          });

          return {
            city,
            ...dataRemittances,
          };
        }),
      );

      return {
        data,
      };
    } else if (regionalPartnerIdForFilter) {
      const regionalPartner = await connectionOn
        .getRepository(RegionalPartner)
        .findOne({
          where: {
            id: regionalPartnerIdForFilter,
          },
        });

      const data = await Promise.all(
        regionalPartner.cities.map(async (city) => {
          const dataRemittances = await this.getTotalTrainedTeachers({
            year,
            partnerStateId,
            regionalPartnerId: regionalPartner.id,
            city,
          });

          return {
            city,
            ...dataRemittances,
          };
        }),
      );

      return {
        data,
      };
    } else if (partnerStateId) {
      const { regionalPartners } = await this.getRegionalPartners(
        partnerStateId,
      );

      const data = await Promise.all(
        regionalPartners.map(async (regionalPartner) => {
          const dataRemittances = await this.getTotalTrainedTeachers({
            year,
            partnerStateId,
            regionalPartnerId: regionalPartner.id,
            city: null,
          });

          return {
            ...regionalPartner,
            ...dataRemittances,
          };
        }),
      );

      return {
        data,
      };
    }
  }

  async trainedTeachersMonth(
    paramsSystemIndicator: ParamsSystemIndicatorDto,
    user: User,
  ) {
    const { year, regionalPartnerIds, cities, partnerStateIds, months } = paramsSystemIndicator;

    this.validateUserIsScholar(user);

    // const { partnerStateId, regionalPartnerIdForFilter, citiesForFilter } =
    //   this.validateRoleProfile(user, regionalPartnerId, null, cities);

    // const connectionOn = this.connection;

    const dataRemittances = await this.getTotalTrainedTeachersMonths({
        year,
        partnerStateIds,//[11,32],
        regionalPartnerIds,//regionalPartnerIdForFilter,
        cities,
        months
      });
      return dataRemittances;
    }

    async stateTrainedTeachersMonth(
      paramsSystemIndicator: ParamsSystemIndicatorDto,
      user: User,
    ) {
      const { year, regionalPartnerIds, regionalPartnerId, cities, months } = paramsSystemIndicator;
  
      this.validateUserIsScholar(user);
  
       const { partnerStateId, regionalPartnerIdForFilter, citiesForFilter } =
         this.validateRoleProfile(user, regionalPartnerId, null, cities);
  
      // const connectionOn = this.connection;

      console.log('partnerStateId = ', partnerStateId);
      console.log('regionalPartnerIdForFilter = ', regionalPartnerIdForFilter);	
  
      const dataRemittances = await this.getTotalTrainedTeachersMonths({
          year,
          partnerStateIds: [partnerStateId],
          regionalPartnerIds: regionalPartnerIdForFilter ? [regionalPartnerIdForFilter] : regionalPartnerIds,
          cities : citiesForFilter ? citiesForFilter : cities,
          months
        });
        return dataRemittances;
      }

}
