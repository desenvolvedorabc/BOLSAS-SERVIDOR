import { Injectable } from '@nestjs/common';
import { CreateBankRemittanceDto } from './dto/create-bank-remittance.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/model/entities/user.entity';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { paginateData } from 'src/helpers/return-data-paginate';
import { MonthlyReportStatus } from '../monthly-reports/enum/monthly-report-status.enum';
import { BankRemittance } from './entities/bank-remittance.entity';
import { Workbook } from 'exceljs';
import { InternalServerError } from 'src/shared/errors';
import { Response } from 'express';
import { GetBankRemittancesParamsDto } from './dto/get-bank-remittances-params.dto';
import { LevelApproveRegistration } from '../monthly-reports/dto/level-approve-registration.enum';
import { formatCPF } from 'src/utils/format-cpf';
import { formatTelephone } from 'src/utils/format-telephone';
import { PaginationParamsByRegion } from './dto/pagination-params-by-region.dto';
import { RegionalPartner } from '../regional-partners/entities/regional-partner.entity';
import { RegionalPartnersService } from '../regional-partners/regional-partners.service';

@Injectable()
export class BankRemittancesService {
  constructor(
    @InjectRepository(BankRemittance)
    private readonly bankRemittanceRepository: Repository<BankRemittance>,

    @InjectRepository(RegionalPartner)
    private readonly regionalPartnerRepository: Repository<RegionalPartner>,

    private readonly regionalPartnerService: RegionalPartnersService,
  ) {}

  create(createBankRemittanceDto: CreateBankRemittanceDto, user: User) {
    const {
      accountNumber,
      accountType,
      agency,
      bank,
      monthlyReport,
      scholarshipValueInCents,
      termOfMembershipId,
    } = createBankRemittanceDto;

    const bankRemittance = this.bankRemittanceRepository.create({
      accountNumber,
      accountType,
      agency,
      bank,
      monthlyReport,
      termOfMembershipId,
      scholarshipValueInCents,
    });

    this.bankRemittanceRepository.save(bankRemittance, {
      data: user,
    });
  }

  async getTotalScholarAndTotalValueRemittances(
    month: number | undefined,
    year: number | undefined,
    partnerStateId: number,
    regionalPartnerId: number,
  ) {
    const queryBuilderTeste = this.bankRemittanceRepository
      .createQueryBuilder('BankRemittances')
      .select('COUNT(DISTINCT(monthlyReport.scholarId))', 'totalScholars')
      .innerJoin('BankRemittances.monthlyReport', 'monthlyReport')
      .innerJoin('monthlyReport.scholar', 'scholar')
      .innerJoin('scholar.user', 'user')
      .where('user.partnerStateId = :partnerStateId', {
        partnerStateId,
      })
      .andWhere('user.regionalPartnerId = :regionalPartnerId', {
        regionalPartnerId,
      })
      .andWhere('monthlyReport.status = :status', {
        status: MonthlyReportStatus.APROVADO,
      });

    if (month) {
      queryBuilderTeste.andWhere('monthlyReport.month = :month', { month });
    }
    if (year) {
      queryBuilderTeste.andWhere('monthlyReport.year = :year', { year });
    }

    const { totalScholars } = await queryBuilderTeste.getRawOne();

    const queryBuilder = this.bankRemittanceRepository
      .createQueryBuilder('BankRemittances')
      .select(
        'SUM(BankRemittances.scholarshipValueInCents)',
        'totalScholarshipValueInCents',
      )
      .innerJoin('BankRemittances.monthlyReport', 'monthlyReport')
      .innerJoin('monthlyReport.scholar', 'scholar')
      .innerJoin('scholar.user', 'user')
      .where('user.partnerStateId = :partnerStateId', {
        partnerStateId,
      })
      .andWhere('user.regionalPartnerId = :regionalPartnerId', {
        regionalPartnerId,
      })
      .andWhere('monthlyReport.status = :status', {
        status: MonthlyReportStatus.APROVADO,
      });

    if (month) {
      queryBuilder.andWhere('monthlyReport.month = :month', { month });
    }
    if (year) {
      queryBuilder.andWhere('monthlyReport.year = :year', { year });
    }

    const { totalScholarshipValueInCents } = await queryBuilder.getRawOne();

    return {
      totalScholars,
      totalScholarshipValueInCents,
    };
  }

  async reportByRegion(paginationParams: PaginationParamsByRegion, user: User) {
    const { page, limit, search, regionalPartnerId, order, month, year } =
      paginationParams;

    const queryBuilder = this.regionalPartnerRepository
      .createQueryBuilder('regionalPartners')
      .select(['regionalPartners.id', 'regionalPartners.name'])
      .innerJoin('regionalPartners.partnerState', 'partnerState')
      .where('partnerState.id = :idPartnerState', {
        idPartnerState: user.partner_state.id,
      })
      .orderBy('regionalPartners.name', order);

    if (search) {
      queryBuilder.andWhere('regionalPartners.name LIKE :q', {
        q: `%${search}%`,
      });
    }

    if (regionalPartnerId) {
      queryBuilder.andWhere('regionalPartners.id = :id', {
        id: regionalPartnerId,
      });
    }

    const data = await paginateData(+page, +limit, queryBuilder);

    const items = await Promise.all(
      data.items.map(async (regionalPartner) => {
        const { totalScholars, totalScholarshipValueInCents } =
          await this.getTotalScholarAndTotalValueRemittances(
            month,
            year,
            user.partnerStateId,
            regionalPartner.id,
          );
        return {
          ...regionalPartner,
          totalScholars,
          totalScholarshipValueInCents: totalScholarshipValueInCents
            ? Number(totalScholarshipValueInCents) / 100
            : 0,
        };
      }),
    );

    return {
      ...data,
      items,
    };
  }

  async getForGeneratePdf(
    { month, year, status, regionalPartnerId }: GetBankRemittancesParamsDto,
    user: User,
  ) {
    const queryBuilder = this.bankRemittanceRepository
      .createQueryBuilder('BankRemittances')
      .select([
        'BankRemittances.id',
        'BankRemittances.bank',
        'BankRemittances.agency',
        'BankRemittances.accountType',
        'BankRemittances.accountNumber',
        'BankRemittances.scholarshipValueInCents',
        'BankRemittances.termOfMembershipId',
        'monthlyReport.id',
        'monthlyReport.month',
        'monthlyReport.year',
        'monthlyReport.updatedAt',
        'scholar.id',
        'scholar.cep',
        'user.id',
        'user.name',
        'user.cpf',
        'user.email',
        'user.telephone',
      ])
      .innerJoin('BankRemittances.monthlyReport', 'monthlyReport')
      .innerJoin('monthlyReport.scholar', 'scholar')
      .innerJoin('scholar.user', 'user')
      .where('user.partnerStateId = :partnerStateId', {
        partnerStateId: user.partnerStateId,
      })
      .andWhere('user.regionalPartnerId = :regionalPartnerId', {
        regionalPartnerId,
      })

      .andWhere('monthlyReport.status = :status', { status })
      .orderBy('BankRemittances.createdAt', 'DESC');

    if (month) {
      queryBuilder.andWhere('monthlyReport.month = :month', { month });
    }
    if (year) {
      queryBuilder.andWhere('monthlyReport.year = :year', { year });
    }

    const data = await queryBuilder.getMany();

    return {
      data,
    };
  }

  async approved(
    response: Response<unknown, Record<string, unknown>>,
    { month, year, regionalPartnerId }: GetBankRemittancesParamsDto,
    user: User,
  ) {
    const regionalPartner = await this.regionalPartnerService.findOneById(
      regionalPartnerId,
      user.partnerStateId,
    );

    const { data } = await this.getForGeneratePdf(
      {
        month,
        year,
        regionalPartnerId,
        status: MonthlyReportStatus.APROVADO,
      },
      user,
    );

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Remessas Bancárias Aprovadas');

    worksheet.columns = [
      {
        header: 'Nome Regional',
        key: 'name_regional',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Mês/Ano',
        key: 'month_year',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'ID Remessa',
        key: 'id',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Nome Bolsista',
        key: 'name',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'CPF',
        key: 'cpf',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Banco',
        key: 'bank',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Agência',
        key: 'agency',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Tipo da Conta',
        key: 'accountType',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'N° da Conta',
        key: 'accountNumber',
        width: 20,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'CEP',
        key: 'cep',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Valor',
        key: 'value',
        width: 20,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'N° do Termo de Compromisso',
        key: 'id_term',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
    ];

    data.forEach((bankRemittance) => {
      worksheet.addRow({
        name_regional: regionalPartner.name,
        month_year: `${bankRemittance.monthlyReport.month}/${bankRemittance.monthlyReport.year}`,
        id: bankRemittance.id,
        name: bankRemittance?.monthlyReport.scholar.user.name ?? 'N/A',
        cpf: formatCPF(bankRemittance?.monthlyReport.scholar.user.cpf) ?? 'N/A',
        bank: bankRemittance?.bank ?? 'N/A',
        agency: bankRemittance?.agency ?? 'N/A',
        accountType: bankRemittance?.accountType ?? 'N/A',
        accountNumber: bankRemittance?.accountNumber ?? 'N/A',
        cep: bankRemittance?.monthlyReport.scholar.cep ?? 'N/A',
        value:
          (bankRemittance?.scholarshipValueInCents / 100).toLocaleString(
            'pt-br',
            { style: 'currency', currency: 'BRL' },
          ) ?? 'N/A',
        id_term: bankRemittance.termOfMembershipId ?? 'N/A',
      });
    });

    try {
      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      response.setHeader(
        'Content-Disposition',
        'attachment; filename=' + 'Remessas_bancárias_aprovadas.xlsx',
      );

      await workbook.xlsx.write(response, {
        filename: 'Remessas_bancárias_aprovadas.xlsx',
      });

      return worksheet;
    } catch (err) {
      throw new InternalServerError();
    }
  }

  async noValidation(
    response: Response<unknown, Record<string, unknown>>,
    { month, year, regionalPartnerId }: GetBankRemittancesParamsDto,
    user: User,
  ) {
    const { data } = await this.getForGeneratePdf(
      {
        month,
        year,
        regionalPartnerId,
        status: MonthlyReportStatus.PENDENTE_VALIDACAO,
      },
      user,
    );

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Remessas Bancárias Pendentes');

    worksheet.columns = [
      {
        header: 'ID Remessa',
        key: 'id',
        width: 10,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'N° do Termo de Compromisso',
        key: 'id_term',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Nome Bolsista',
        key: 'name',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Status',
        key: 'status',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'E-mail',
        key: 'email',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Telefone',
        key: 'telephone',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'DT / HR Envio',
        key: 'dt_hr_send',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
    ];

    data.forEach((bankRemittance) => {
      const date = new Date(bankRemittance?.monthlyReport.updatedAt);

      date.setHours(date.getHours() - 3);

      worksheet.addRow({
        id: bankRemittance.id,
        name: bankRemittance?.monthlyReport.scholar.user.name ?? 'N/A',
        email: bankRemittance?.monthlyReport.scholar.user.email ?? 'N/A',
        status: 'Pendente Validação',
        telephone:
          formatTelephone(
            bankRemittance?.monthlyReport.scholar.user.telephone,
          ) ?? 'N/A',
        dt_hr_send:
          format(date, 'dd/MM/yyyy HH:mm', {
            locale: ptBR,
          }) ?? 'N/A',
        id_term: bankRemittance.termOfMembershipId ?? 'N/A',
      });
    });

    try {
      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      response.setHeader(
        'Content-Disposition',
        'attachment; filename=' + 'Remessas_bancárias_pendentes_validacao.xlsx',
      );

      await workbook.xlsx.write(response, {
        filename: 'Remessas_bancárias_pendentes_validacao.xlsx',
      });

      return worksheet;
    } catch (err) {
      throw new InternalServerError();
    }
  }

  async reproved(
    response: Response<unknown, Record<string, unknown>>,
    { month, year, regionalPartnerId }: GetBankRemittancesParamsDto,
    user: User,
  ) {
    const queryBuilder = this.bankRemittanceRepository
      .createQueryBuilder('BankRemittances')
      .select([
        'BankRemittances.id',
        'BankRemittances.termOfMembershipId',
        'monthlyReport.id',
        'monthlyReport.levelApproveRegistration',
        'scholar.id',
        'user.id',
        'user.name',
        'user.email',
        'user.telephone',
      ])
      .innerJoin('BankRemittances.monthlyReport', 'monthlyReport')
      .innerJoin('monthlyReport.scholar', 'scholar')
      .leftJoinAndSelect(
        'monthlyReport.validationHistoryCounty',
        'validationHistoryCounty',
      )
      .leftJoinAndSelect(
        'monthlyReport.validationHistoryRegional',
        'validationHistoryRegional',
      )
      .leftJoinAndSelect(
        'monthlyReport.validationHistoryState',
        'validationHistoryState',
      )
      .innerJoin('scholar.user', 'user')
      .where('user.partnerStateId = :partnerStateId', {
        partnerStateId: user.partnerStateId,
      })
      .andWhere('user.regionalPartnerId = :regionalPartnerId', {
        regionalPartnerId,
      })

      .andWhere('monthlyReport.status = :status', {
        status: MonthlyReportStatus.REPROVADO,
      })
      .orderBy('BankRemittances.createdAt', 'DESC');

    if (month) {
      queryBuilder.andWhere('monthlyReport.month = :month', { month });
    }
    if (year) {
      queryBuilder.andWhere('monthlyReport.year = :year', { year });
    }

    const data = await queryBuilder.getMany();

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Remessas Bancárias Reprovadas');

    worksheet.columns = [
      {
        header: 'ID Remessa',
        key: 'id',
        width: 10,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Nome Bolsista',
        key: 'name',
        width: 50,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'N° do Termo de Compromisso',
        key: 'id_term',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Status',
        key: 'status',
        width: 20,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'E-mail',
        key: 'email',
        width: 50,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Telefone',
        key: 'telephone',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Motivo Reprova',
        key: 'justificationReprove',
        width: 80,
        style: { alignment: { horizontal: 'center' } },
      },
    ];

    data.forEach((bankRemittance) => {
      let justificationReprove = 'N/A';

      if (
        bankRemittance?.monthlyReport.levelApproveRegistration ===
        LevelApproveRegistration.MUNICIPIO
      ) {
        justificationReprove =
          bankRemittance?.monthlyReport?.validationHistoryCounty
            ?.justificationReprove ?? 'N/A';
      } else if (
        bankRemittance?.monthlyReport.levelApproveRegistration ===
        LevelApproveRegistration.REGIONAL
      ) {
        justificationReprove =
          bankRemittance?.monthlyReport?.validationHistoryRegional
            ?.justificationReprove ?? 'N/A';
      } else if (
        bankRemittance?.monthlyReport.levelApproveRegistration ===
        LevelApproveRegistration.ESTADO
      ) {
        justificationReprove =
          bankRemittance?.monthlyReport?.validationHistoryState
            ?.justificationReprove ?? 'N/A';
      }

      worksheet.addRow({
        id: bankRemittance.id,
        name: bankRemittance?.monthlyReport.scholar.user.name ?? 'N/A',
        id_term: bankRemittance.termOfMembershipId ?? 'N/A',
        email: bankRemittance?.monthlyReport.scholar.user.email ?? 'N/A',
        status: 'Reprovado',
        telephone:
          formatTelephone(
            bankRemittance?.monthlyReport.scholar.user.telephone,
          ) ?? 'N/A',
        justificationReprove,
      });
    });

    try {
      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      response.setHeader(
        'Content-Disposition',
        'attachment; filename=' + 'Remessas_bancárias_reprovadas.xlsx',
      );

      await workbook.xlsx.write(response, {
        filename: 'Remessas_bancárias_reprovadas.xlsx',
      });

      return worksheet;
    } catch (err) {
      throw new InternalServerError();
    }
  }

  async annualShipmentForScholar(
    response: Response<unknown, Record<string, unknown>>,
    user: User,
  ) {
    const year = new Date().getFullYear();

    const queryBuilder = this.bankRemittanceRepository
      .createQueryBuilder('BankRemittances')
      .select([
        'BankRemittances.id',
        'BankRemittances.bank',
        'BankRemittances.agency',
        'BankRemittances.accountType',
        'BankRemittances.accountNumber',
        'BankRemittances.scholarshipValueInCents',
        'BankRemittances.termOfMembershipId',
        'monthlyReport.id',
        'monthlyReport.month',
        'monthlyReport.year',
        'monthlyReport.status',
      ])
      .innerJoin('BankRemittances.monthlyReport', 'monthlyReport')
      .innerJoin('monthlyReport.scholar', 'scholar')
      .innerJoin('scholar.user', 'user')
      .where('scholar.userId = :userId', {
        userId: user.id,
      })
      .andWhere('monthlyReport.year = :year', { year })
      .orderBy('monthlyReport.month', 'DESC');

    const data = await queryBuilder.getMany();

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Remessas Anual');

    worksheet.columns = [
      {
        header: 'Mês/Ano',
        key: 'month_year',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'ID Remessa',
        key: 'id',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Nome Bolsista',
        key: 'name',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'CPF',
        key: 'cpf',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Banco',
        key: 'bank',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Agência',
        key: 'agency',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Tipo da Conta',
        key: 'accountType',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'N° da Conta',
        key: 'accountNumber',
        width: 20,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Status',
        key: 'status',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Valor',
        key: 'value',
        width: 20,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'N° do Termo de Compromisso',
        key: 'id_term',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
    ];

    data.forEach((bankRemittance) => {
      worksheet.addRow({
        id: bankRemittance.id,
        name: user.name ?? 'N/A',
        cpf: formatCPF(user.cpf) ?? 'N/A',
        month_year: `${bankRemittance.monthlyReport.month}/${bankRemittance.monthlyReport.year}`,
        bank: bankRemittance?.bank ?? 'N/A',
        agency: bankRemittance?.agency ?? 'N/A',
        accountType: bankRemittance?.accountType ?? 'N/A',
        accountNumber: bankRemittance?.accountNumber ?? 'N/A',
        status: bankRemittance?.monthlyReport.status ?? 'N/A',
        value:
          (bankRemittance?.scholarshipValueInCents / 100).toLocaleString(
            'pt-br',
            { style: 'currency', currency: 'BRL' },
          ) ?? 'N/A',
        id_term: bankRemittance.termOfMembershipId ?? 'N/A',
      });
    });

    try {
      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      response.setHeader(
        'Content-Disposition',
        'attachment; filename=' + 'Remessa_anual.xlsx',
      );

      await workbook.xlsx.write(response, {
        filename: 'Remessa_anual.xlsx',
      });

      return worksheet;
    } catch (err) {
      throw new InternalServerError();
    }
  }
}
