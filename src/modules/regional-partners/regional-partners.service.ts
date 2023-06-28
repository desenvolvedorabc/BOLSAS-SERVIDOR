import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import { Workbook, Worksheet } from 'exceljs';
import { PaginationParams } from 'src/helpers/params';
import { User } from '../user/model/entities/user.entity';
import { CreateRegionalPartnerDto } from './dto/create-regional-partner.dto';
import { UpdateRegionalPartnerDto } from './dto/update-regional-partner.dto';
import { RegionalPartner } from './entities/regional-partner.entity';
import { ConflictError } from './errors/conflict-error';
import { RegionalPartnersRepository } from './repositories/regional-partners-repository';

@Injectable()
export class RegionalPartnersService {
  constructor(
    @InjectRepository(RegionalPartnersRepository)
    private readonly regionalPartnersRepository: RegionalPartnersRepository,
  ) {}

  async create(
    dto: CreateRegionalPartnerDto,
    user: User,
  ): Promise<RegionalPartner> {
    const { name } = dto;

    const isVerifyExistsRegionalByName = await this.verifyExistsRegionalByName(
      name,
      user.partner_state.id,
    );

    if (isVerifyExistsRegionalByName) {
      throw new ConflictError();
    }

    return this.regionalPartnersRepository._create(dto, user);
  }

  async findOneById(
    id: number,
    idPartnerState: number,
  ): Promise<RegionalPartner> {
    const regionalPartner = await this.regionalPartnersRepository.findOneById(
      id,
    );

    if (regionalPartner.partnerState.id !== idPartnerState) {
      throw new BadRequestException(
        'Você não tem acesso a esta regional parceira.',
      );
    }

    return regionalPartner;
  }

  paginate(paginationParams: PaginationParams, user: User) {
    return this.regionalPartnersRepository.paginate(paginationParams, user);
  }

  byPartnerState(paginationParams: PaginationParams) {
    return this.regionalPartnersRepository.byPartnerState(paginationParams);
  }

  async update(
    id: number,
    dto: UpdateRegionalPartnerDto,
    user: User,
  ): Promise<RegionalPartner> {
    const { name } = dto;
    const verifyExistsRegionalByName = await this.verifyExistsRegionalByName(
      name,
      user.partner_state.id,
    );

    if (dto.active === false) {
      await this.verifyExistsUsersActive(id);
    }

    if (verifyExistsRegionalByName && verifyExistsRegionalByName.id !== id) {
      throw new ConflictError();
    }

    return this.regionalPartnersRepository._update(id, dto, user);
  }

  private async verifyExistsRegionalByName(
    name: string,
    idPartnerState: number,
  ): Promise<RegionalPartner> {
    const existsRegionalByName = await this.regionalPartnersRepository.findOne({
      where: {
        name,
        partnerState: {
          id: idPartnerState,
        },
      },
    });

    return existsRegionalByName;
  }

  async verifyExistsUsersActive(id: number): Promise<void> {
    const accessProfile =
      await this.regionalPartnersRepository.findOneByIdWithUsersActive(id);

    if (accessProfile.users.length) {
      throw new BadRequestException(
        'Você não pode inativar um perfil de acesso com usuários ativos',
      );
    }
  }

  async excel(
    paginationParams: PaginationParams,
    response: Response<unknown, Record<string, unknown>>,
    user: User,
  ): Promise<Worksheet> {
    const params = {
      ...paginationParams,
      page: 1,
      limit: 9999999,
    };

    const { items } = await this.paginate(params as PaginationParams, user);

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Regionais Parceiras');

    worksheet.columns = [
      {
        header: 'id',
        key: 'id',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Nome',
        key: 'name',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Status',
        key: 'status',
        width: 20,
        style: { alignment: { horizontal: 'center' } },
      },
    ];

    items.forEach((item) => {
      worksheet.addRow({
        id: user.id,
        name: item?.name ?? '',
        status: item.active ? 'Ativo' : 'Inativo',
      });
    });

    try {
      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      response.setHeader(
        'Content-Disposition',
        'attachment; filename=' + 'Relatório_de_regionais_parceiras.xlsx',
      );

      await workbook.xlsx.write(response, {
        filename: 'Relatório_de_regionais_parceiras.xlsx',
      });

      return worksheet;
    } catch (err) {
      console.log(err);
    }
  }
}
