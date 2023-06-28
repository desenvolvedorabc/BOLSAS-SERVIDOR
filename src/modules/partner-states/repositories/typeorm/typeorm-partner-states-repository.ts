import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationParams } from 'src/helpers/params';
import { paginateData } from 'src/helpers/return-data-paginate';
import { User } from 'src/modules/user/model/entities/user.entity';
import { convertToSlug } from 'src/utils/convert-to-slug';
import { Repository } from 'typeorm';
import { CreatePartnerStateDto } from '../../dto/create-partner-state.dto';
import { UpdatePartnerStateDto } from '../../dto/update-partner-state.dto';
import { PartnerState } from '../../entities/partner-state.entity';
import { PartnerStatesRepository } from '../partner-states-repository';

@Injectable()
export class TypeormPartnerStatesRepository implements PartnerStatesRepository {
  constructor(
    @InjectRepository(PartnerState)
    private readonly partnerStatesRepository: Repository<PartnerState>,
  ) {}

  async create(
    createPartnerStateDto: CreatePartnerStateDto,
    user: User,
  ): Promise<PartnerState> {
    const { abbreviation, cod_ibge, name, color } = createPartnerStateDto;

    const slug = convertToSlug(name);

    const partner_state = this.partnerStatesRepository.create({
      name,
      cod_ibge,
      abbreviation,
      slug,
      color,
    });

    try {
      return await this.partnerStatesRepository.save(partner_state, {
        data: user,
      });
    } catch (e) {
      if (e.sqlState.toString() === '23000') {
        throw new ConflictException(
          'Já existe um estado parceiro cadastrado com esse Nome/UF',
        );
      } else {
        throw new InternalServerErrorException(
          'Houve uma falha ao criar um estado parceiro',
        );
      }
    }
  }

  async findOne(id: number): Promise<PartnerState> {
    const partner_state = await this.partnerStatesRepository.findOne({
      where: {
        id,
      },
    });

    if (!partner_state) {
      throw new NotFoundException('Estado parceiro não encontrado!');
    }

    return partner_state;
  }

  async findOneBySlug(slug: string): Promise<PartnerState> {
    const partner_state = await this.partnerStatesRepository.findOne({
      where: {
        slug,
        active: true,
      },
    });

    if (!partner_state) {
      throw new NotFoundException('Estado parceiro não encontrado!');
    }

    return partner_state;
  }

  async update(
    id: number,
    updatePartnerStateDto: UpdatePartnerStateDto,
    user: User,
  ): Promise<PartnerState> {
    const partner_state = await this.findOne(id);

    const formattedDto = {
      ...partner_state,
      ...updatePartnerStateDto,
    };

    const slug = convertToSlug(formattedDto.name);

    if (updatePartnerStateDto.active === false) {
      await this.verifyExistsUsersInactiveInPartnerState(id);
    }

    try {
      return await this.partnerStatesRepository.save(
        { ...formattedDto, slug },
        {
          data: user,
        },
      );
    } catch (e) {
      if (e.sqlState.toString() === '23000') {
        throw new ConflictException(
          'Já existe um estado parceiro cadastrado com esse Nome/UF',
        );
      } else {
        throw new InternalServerErrorException(
          'Error ao atualizar estado parceiro.',
        );
      }
    }
  }

  findAll(paginationParams: PaginationParams) {
    const { page, limit, order, search, column, status } = paginationParams;

    const queryBuilder =
      this.partnerStatesRepository.createQueryBuilder('partner_states');

    if (search) {
      queryBuilder.andWhere('partner_states.name LIKE :q', {
        q: `%${search}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('partner_states.active = :status', { status });
    }

    switch (column) {
      case 'name':
        queryBuilder.orderBy('partner_states.name', order);
        break;
      case 'status':
        queryBuilder.orderBy('partner_states.active', order);
        break;
      default:
        queryBuilder.orderBy('partner_states.name', order);
        break;
    }

    return paginateData(+page, +limit, queryBuilder);
  }

  async verifyExistsUsersInactiveInPartnerState(id: number): Promise<void> {
    const partnerState = await this.partnerStatesRepository
      .createQueryBuilder('partnerState')
      .leftJoinAndSelect('partnerState.users', 'users', 'users.active = TRUE')
      .where('partnerState.id = :id', { id })
      .getOne();

    if (partnerState.users.length) {
      throw new BadRequestException(
        'Você não pode inativar estados parceiros com usuários ativos',
      );
    }
  }
}
