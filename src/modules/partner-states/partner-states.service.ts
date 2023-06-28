import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workbook, Worksheet } from 'exceljs';
import { Response } from 'express';
import { writeFileSync } from 'fs';
import { PaginationParams } from 'src/helpers/params';
import { editFileName } from 'src/helpers/utils';
import { Repository } from 'typeorm';
import { User } from '../user/model/entities/user.entity';
import { CreatePartnerStateDto } from './dto/create-partner-state.dto';
import { UpdatePartnerStateDto } from './dto/update-partner-state.dto';
import { PartnerState } from './entities/partner-state.entity';
import { PartnerStatesRepository } from './repositories/partner-states-repository';

@Injectable()
export class PartnerStatesService {
  constructor(
    @InjectRepository(PartnerState)
    private readonly partnerStatesRepository: Repository<PartnerState>,

    private partnerStatesRepositoryTest: PartnerStatesRepository,
  ) {}

  create(
    createPartnerStateDto: CreatePartnerStateDto,
    user: User,
  ): Promise<PartnerState> {
    return this.partnerStatesRepositoryTest.create(createPartnerStateDto, user);
  }

  findAll(paginationParams: PaginationParams) {
    return this.partnerStatesRepositoryTest.findAll(paginationParams);
  }

  findOne(id: number): Promise<PartnerState> {
    return this.partnerStatesRepositoryTest.findOne(id);
  }

  findOneBySlug(slug: string): Promise<PartnerState> {
    return this.partnerStatesRepositoryTest.findOneBySlug(slug);
  }

  update(id: number, dto: UpdatePartnerStateDto, user: User) {
    return this.partnerStatesRepositoryTest.update(id, dto, user);
  }

  async excel(
    paginationParams: PaginationParams,
    response: Response<unknown, Record<string, unknown>>,
  ): Promise<Worksheet> {
    const params = {
      ...paginationParams,
      page: 1,
      limit: 999999999,
    };

    const { items } = await this.findAll(params as PaginationParams);

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Estados Parceiros');

    worksheet.columns = [
      {
        header: 'id',
        key: 'id',
        width: 20,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Nome',
        key: 'name',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Código IBGE',
        key: 'cod_ibge',
        width: 15,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Abreviação',
        key: 'abbreviation',
        width: 15,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Status',
        key: 'status',
        width: 20,
        style: { alignment: { horizontal: 'center' } },
      },
    ];

    items.forEach((state) => {
      worksheet.addRow({
        id: state.id,
        name: state?.name ?? '',
        cod_ibge: state.cod_ibge,
        abbreviation: state.abbreviation,
        status: state.active ? 'Ativo' : 'Inativo',
      });
    });

    try {
      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      response.setHeader(
        'Content-Disposition',
        'attachment; filename=' + 'Relatório_de_estados_parceiros.xlsx',
      );

      await workbook.xlsx.write(response, {
        filename: 'Relatório_de_estados_parceiros.xlsx',
      });

      return worksheet;
    } catch (err) {
      console.log(err);
    }
  }

  async updateAvatar(
    id: number,
    filename: string,
    base64: string,
    user: User,
  ): Promise<string> {
    const partner_state = await this.findOne(id);
    const folderName = './public/user/avatar/';

    const newFileName = editFileName(filename);
    partner_state.logo = newFileName;
    writeFileSync(`${folderName}${newFileName}`, base64, {
      encoding: 'base64',
    });
    await this.partnerStatesRepository.save(partner_state, {
      data: user,
    });

    return newFileName;
  }
}
