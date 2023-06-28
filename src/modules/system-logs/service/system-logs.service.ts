import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format } from 'date-fns';
import { Workbook } from 'exceljs';
import { Response } from 'express';
import {
  paginate,
  Pagination,
  PaginationTypeEnum,
} from 'nestjs-typeorm-paginate';
import { PaginationParamsLogs } from 'src/helpers/params';
import { paginateData } from 'src/helpers/return-data-paginate';
import { entitiesMock } from 'src/utils/mocks/entities-mock';
import { Repository } from 'typeorm';
import { CreateSystemLogsDto } from '../model/dtos/create-system-logs.dto';
import { SystemLogs } from '../model/entities/system-log.entity';
import { User } from 'src/modules/user/model/entities/user.entity';
import { CredentialRole } from 'src/modules/user/model/enum/role.enum';

@Injectable()
export class SystemLogsService {
  constructor(
    @InjectRepository(SystemLogs)
    private systemLogsRepository: Repository<SystemLogs>,
  ) {}

  create(createSystemLogsDto: CreateSystemLogsDto) {
    const { method, nameEntity, stateFinal, stateInitial, user } =
      createSystemLogsDto;

    const systemLogs = this.systemLogsRepository.create({
      method,
      nameEntity,
      stateInitial,
      stateFinal,
      user,
    });

    this.systemLogsRepository.save(systemLogs);
  }

  async findOne(id: string): Promise<SystemLogs> {
    const systemLogs = await this.systemLogsRepository
      .createQueryBuilder('SystemLogs')
      .select([
        'SystemLogs',
        'user',
        'access_profile',
        'regionalPartner.id',
        'regionalPartner.name',
      ])
      .leftJoin('SystemLogs.user', 'user')
      .leftJoin('user.access_profile', 'access_profile')
      .leftJoin('user.regionalPartner', 'regionalPartner')
      .where('SystemLogs.id = :id', { id })
      .getOne();

    if (!systemLogs) {
      throw new NotFoundException('Logs não encontrado');
    }

    return systemLogs;
  }

  paginate(
    {
      page,
      limit,
      method,
      order,
      column,
      search,
      entity,
      origin,
      initialDate,
      finalDate,
      regionalPartnerId,
      city,
    }: PaginationParamsLogs,
    user: User,
  ): Promise<Pagination<SystemLogs>> {
    const queryBuilder = this.systemLogsRepository
      .createQueryBuilder('logs')
      .select([
        'logs',
        'user.id',
        'user.name',
        'user.role',
        'user.subRole',
        'user.email',
      ])
      .leftJoin('logs.user', 'user');

    if (user.role === CredentialRole.ESTADO) {
      queryBuilder.andWhere('user.partnerStateId = :partnerStateId', {
        partnerStateId: user.partnerStateId,
      });

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
    }

    if (search) {
      queryBuilder.andWhere('user.name LIKE :search', {
        search: `%${search}%`,
      });
    }

    if (origin) {
      queryBuilder.andWhere('user.role = :origin', { origin });
    }

    if (method) {
      queryBuilder.andWhere('logs.method = :method', { method });
    }

    if (entity) {
      queryBuilder.andWhere('logs.nameEntity = :entity', { entity });
    }

    if (initialDate) {
      const formattedInitialDate = new Date(initialDate);

      formattedInitialDate.setUTCHours(0, 0, 0, 0);

      queryBuilder.andWhere('logs.createdAt >= :initialDate', {
        initialDate: formattedInitialDate,
      });
    }

    if (finalDate) {
      const formattedFinalDate = new Date(finalDate);

      formattedFinalDate.setUTCHours(23, 59, 59, 999);

      queryBuilder.andWhere('logs.createdAt <= :finalDate', {
        finalDate: formattedFinalDate,
      });
    }

    switch (column) {
      case 'createdAt':
        queryBuilder.orderBy('logs.createdAt', order);
        break;
      case 'method':
        queryBuilder.orderBy('logs.method', order);
        break;
      case 'nameEntity':
        queryBuilder.orderBy('logs.nameEntity', order);
        break;
      case 'stateInitial':
        queryBuilder.orderBy('logs.stateInitial', order);
        break;
      case 'stateFinal':
        queryBuilder.orderBy('logs.stateFinal', order);
        break;
      case 'origin':
        queryBuilder.orderBy('user.role', order);
        break;
      case 'user':
        queryBuilder.orderBy('user.name', order);
        break;
      default:
        queryBuilder.orderBy('logs.createdAt', 'DESC');
        break;
    }

    return paginateData(page, limit, queryBuilder);
  }

  async generateExcel(
    paginationParams: PaginationParamsLogs,
    response: Response<unknown, Record<string, unknown>>,
    user: User,
  ) {
    const params = {
      ...paginationParams,
      page: 1,
      limit: 99999999999,
    };

    const { items: logs } = await this.paginate(
      params as PaginationParamsLogs,
      user,
    );

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Logs do Sistema');

    worksheet.columns = [
      {
        header: 'Data/Hora',
        key: 'dateAndHour',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'ID',
        key: 'id',
        width: 20,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Origem',
        key: 'origin',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'E-mail',
        key: 'email',
        width: 40,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Entidade',
        key: 'entity',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Método',
        key: 'method',
        width: 20,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Estado Antes',
        key: 'stateInitial',
        width: 50,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Estado Depois',
        key: 'stateFinal',
        width: 50,
        style: { alignment: { horizontal: 'center' } },
      },
    ];

    logs.forEach((log) => {
      worksheet.addRow({
        dateAndHour: format(new Date(log.createdAt), 'dd/MM/yyyy - HH:mm:ss'),
        id: log.id,
        origin: log?.user?.role ?? '-',
        email: log?.user?.email ?? '-',
        entity: entitiesMock[log?.nameEntity] ?? '-',
        method: log.method,
        stateInitial: log?.stateInitial ?? '-',
        stateFinal: log?.stateFinal ?? '-',
      });
    });

    try {
      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      response.setHeader(
        'Content-Disposition',
        'attachment; filename=' + 'Relatório_de_logs.xlsx',
      );

      await workbook.xlsx.write(response, {
        filename: 'Relatório_de_logs.xlsx',
      });

      return worksheet;
    } catch (err) {
      console.log(err);
    }
  }
}
