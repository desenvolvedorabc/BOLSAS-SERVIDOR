import { Injectable } from '@nestjs/common';
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
import { MonthlyReportsService } from 'src/modules/monthly-reports/monthly-reports.service';

@Injectable()
export class SystemIndicatorsParcService {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,

    private readonly monthlyReportsService: MonthlyReportsService,
  ) {}

  async macroIndicatorsGeneral() {
    const connectionOn = this.connection;

    const totalStates = await connectionOn.getRepository(PartnerState).count({
      where: {
        active: true,
      },
    });

    const totalScholars = await connectionOn.getRepository(User).count({
      where: {
        subRole: SubCredentialRole.BOLSISTA,
        active: true,
      },
    });

    const totalMonthReports = await connectionOn
      .getRepository(MonthlyReport)
      .count();

    const totalMonthReportsNotPendingShipment = await connectionOn
      .getRepository(MonthlyReport)
      .count({
        where: {
          status: Not(MonthlyReportStatus.PENDENTE_ENVIO),
        },
      });

    const deliveryAverageMonthReports = (
      (totalMonthReportsNotPendingShipment / totalMonthReports) *
      100
    ).toFixed(2);

    const terms = await connectionOn.getRepository(TermsOfMembership).find({
      where: {
        status: TermOfMembershipStatus.ASSINADO,
      },
      select: ['id', 'endDate', 'startDate', 'extensionDate'],
    });

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

    const averageMonthsOfTerms = Math.round(totalMonthsOfTerms / terms.length);

    return {
      totalStates,
      totalScholars,
      deliveryAverageMonthReports,
      averageMonthsOfTerms,
    };
  }

  private async getPartnerStates() {
    const partnerStates = await this.connection
      .getRepository(PartnerState)
      .find({
        select: ['id', 'name'],
        where: {
          active: true,
        },
      });

    return {
      partnerStates,
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
      .andWhere('Users.active = TRUE')
      .andWhere('YEAR(Users.createdAt) = :year', { year });

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

  async systemActiveStates() {
    const { partnerStates } = await this.getPartnerStates();

    return {
      totalStates: 27,
      totalPartnerStates: partnerStates.length,
      partnerStates,
    };
  }

  async getScholarsForIndicator(
    paramsSystemIndicator: ParamsSystemIndicatorDto,
  ) {
    const { year, partnerStateId, regionalPartnerId, cities } =
      paramsSystemIndicator;

    const connectionOn = this.connection;

    if (cities?.length) {
      const data = await Promise.all(
        cities.map(async (city) => {
          const { totalScholars } = await this.getScholars(
            year,
            null,
            regionalPartnerId,
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
          const { totalScholars } = await this.getScholars(
            year,
            null,
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
            null,
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
    } else {
      const { partnerStates } = await this.getPartnerStates();

      const data = await Promise.all(
        partnerStates.map(async (partnerState) => {
          const { totalScholars } = await this.getScholars(
            year,
            partnerState.id,
            null,
            null,
          );

          return {
            ...partnerState,
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
      .andWhere('YEAR(TermsOfMembership.createdAt) = :year', { year })
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
  ) {
    const { year, partnerStateId, regionalPartnerId, cities } =
      paramsSystemIndicator;

    const connectionOn = this.connection;

    if (cities?.length) {
      const data = await Promise.all(
        cities.map(async (city) => {
          const dataAverage = await this.getAverageValueOfTerms(
            year,
            partnerStateId,
            regionalPartnerId,
            city,
          );

          return {
            city,
            ...dataAverage,
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
          const dataAverage = await this.getAverageValueOfTerms(
            year,
            partnerStateId,
            regionalPartner.id,
            city,
          );

          return {
            city,
            ...dataAverage,
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
          const dataAverage = await this.getAverageValueOfTerms(
            year,
            partnerStateId,
            regionalPartner.id,
            null,
          );

          return {
            ...regionalPartner,
            ...dataAverage,
          };
        }),
      );

      return {
        data,
      };
    } else {
      const { partnerStates } = await this.getPartnerStates();

      const data = await Promise.all(
        partnerStates.map(async (partnerState) => {
          const dataAverage = await this.getAverageValueOfTerms(
            year,
            partnerState.id,
            null,
            null,
          );

          return {
            ...partnerState,
            ...dataAverage,
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
      .andWhere('YEAR(TermsOfMembership.createdAt) = :year', { year })
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
    } else {
      const { partnerStates } = await this.getPartnerStates();

      const data = await Promise.all(
        partnerStates.map(async (partnerState) => {
          const { averageMonthsOfTerms } = await this.getTermsToValidateStay(
            year,
            partnerState.id,
            null,
            null,
          );

          return {
            ...partnerState,
            averageMonthsOfTerms,
          };
        }),
      );

      return {
        data,
      };
    }
  }

  async getDeliveryAverageMonthReportsForIndicator(
    paramsSystemIndicator: ParamsSystemIndicatorDto,
  ) {
    const { year, month, partnerStateId, regionalPartnerId, cities } =
      paramsSystemIndicator;

    const connectionOn = this.connection;

    if (cities?.length) {
      const data = await Promise.all(
        cities.map(async (city) => {
          const data =
            await this.monthlyReportsService.getDeliveryAverageMonthReportsForIndicator(
              {
                year,
                month,
                partnerStateId,
                regionalPartnerId,
                city,
              },
            );

          return {
            city,
            ...data,
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
          const data =
            await this.monthlyReportsService.getDeliveryAverageMonthReportsForIndicator(
              {
                year,
                month,
                partnerStateId,
                regionalPartnerId,
                city,
              },
            );

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
          const data =
            await this.monthlyReportsService.getDeliveryAverageMonthReportsForIndicator(
              {
                year,
                month,
                partnerStateId,
                regionalPartnerId: regionalPartner.id,
              },
            );

          return {
            ...regionalPartner,
            ...data,
          };
        }),
      );

      return {
        data,
      };
    } else {
      const { partnerStates } = await this.getPartnerStates();

      const data = await Promise.all(
        partnerStates.map(async (partnerState) => {
          const data =
            await this.monthlyReportsService.getDeliveryAverageMonthReportsForIndicator(
              {
                year,
                month,
                partnerStateId: partnerState.id,
              },
            );

          return {
            ...partnerState,
            ...data,
          };
        }),
      );

      return {
        data,
      };
    }
  }
}
