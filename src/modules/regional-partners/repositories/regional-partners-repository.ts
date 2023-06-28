import { NotFoundException } from '@nestjs/common';
import { PaginationParams } from 'src/helpers/params';
import { paginateData } from 'src/helpers/return-data-paginate';
import { User } from 'src/modules/user/model/entities/user.entity';
import { InternalServerError } from 'src/shared/errors';
import { EntityRepository, Repository } from 'typeorm';
import { CreateRegionalPartnerDto } from '../dto/create-regional-partner.dto';
import { UpdateRegionalPartnerDto } from '../dto/update-regional-partner.dto';
import { RegionalPartner } from '../entities/regional-partner.entity';
import { ProfileRole } from 'src/modules/profile/model/enum/profile-role';

const OPTIONS_ORDER = {
  name: 'name',
  status: 'active',
};

@EntityRepository(RegionalPartner)
export class RegionalPartnersRepository extends Repository<RegionalPartner> {
  async _create(
    createRegionalPartnerDto: CreateRegionalPartnerDto,
    user: User,
  ): Promise<RegionalPartner> {
    const partnerState = user.partner_state;

    const {
      abbreviation,
      name,

      cities,
    } = createRegionalPartnerDto;

    const regionalPartner = this.create({
      name,
      abbreviation,

      cities,
      partnerState,
    });

    try {
      return await this.save(regionalPartner, {
        data: user,
      });
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async findOneById(id: number): Promise<RegionalPartner> {
    const regionalPartner = await this.findOne({
      where: {
        id,
      },
      relations: ['partnerState'],
    });

    if (!regionalPartner) {
      throw new NotFoundException('Regional parceira não encontrada!');
    }

    return regionalPartner;
  }

  paginate(paginationParams: PaginationParams, user: User) {
    const { page, limit, order, search, column, status } = paginationParams;

    const roleProfile = user?.access_profile?.role;
    const optionsRoleFilter = [ProfileRole.REGIONAL, ProfileRole.MUNICIPIO];

    const queryBuilder = this.createQueryBuilder('regionalPartners')
      .leftJoin('regionalPartners.partnerState', 'partnerState')
      .where('partnerState.id = :idPartnerState', {
        idPartnerState: user.partner_state.id,
      });

    if (search) {
      queryBuilder.andWhere('regionalPartners.name LIKE :q', {
        q: `%${search}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('regionalPartners.active = :status', { status });
    }

    if (optionsRoleFilter.includes(roleProfile)) {
      queryBuilder.andWhere('regionalPartners.id = :id', {
        id: user.regionalPartnerId,
      });
    }

    const option = OPTIONS_ORDER[column] ?? 'name';

    queryBuilder.orderBy(`regionalPartners.${option}`, order);

    return paginateData(+page, +limit, queryBuilder);
  }

  byPartnerState(paginationParams: PaginationParams) {
    const { page, limit, search, partnerState } = paginationParams;

    const queryBuilder = this.createQueryBuilder('regionalPartners')
      .select([
        'regionalPartners.id',
        'regionalPartners.name',
        'regionalPartners.cities',
      ])
      .where('regionalPartners.partnerStateId = :partnerStateId', {
        partnerStateId: partnerState,
      })
      .andWhere('regionalPartners.active = TRUE')
      .orderBy(`regionalPartners.name`, 'ASC');

    if (search) {
      queryBuilder.andWhere('regionalPartners.name LIKE :q', {
        q: `%${search}%`,
      });
    }

    return paginateData(+page, +limit, queryBuilder);
  }

  async _update(
    id: number,
    updateRegionalPartnerDto: UpdateRegionalPartnerDto,
    user: User,
  ): Promise<RegionalPartner> {
    let regionalPartner = await this.findOneById(id);

    regionalPartner = Object.assign(regionalPartner, {
      ...regionalPartner,
      ...updateRegionalPartnerDto,
    });

    try {
      return await this.save(regionalPartner, {
        data: user,
      });
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async findOneByIdWithUsersActive(id: number): Promise<RegionalPartner> {
    const regionalPartner = await this.createQueryBuilder('regionalPartner')
      .leftJoinAndSelect(
        'regionalPartner.users',
        'users',
        'users.active = TRUE',
      )
      .where('regionalPartner.id = :id', { id })
      .getOne();

    return regionalPartner;
  }
}
