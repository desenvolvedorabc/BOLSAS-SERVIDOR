import { ConflictException } from '@nestjs/common';
import { PaginationParams } from 'src/helpers/params';
import { paginateData } from 'src/helpers/return-data-paginate';
import { User } from 'src/modules/user/model/entities/user.entity';
import { CredentialRole } from 'src/modules/user/model/enum/role.enum';
import { SubCredentialRole } from 'src/modules/user/model/enum/sub-role.enum';
import { ForbiddenError, InternalServerError } from 'src/shared/errors';
import { EntityRepository, Repository } from 'typeorm';
import { CreateAccessProfileDto } from '../model/dto/create-access-profile.dto';
import { UpdateAccessProfileDto } from '../model/dto/update-access-profile.dto';
import { AccessProfile } from '../model/entities/access-profile.entity';
import { ProfileRole } from '../model/enum/profile-role';

@EntityRepository(AccessProfile)
export class AccessProfileRepository extends Repository<AccessProfile> {
  async createAccessProfile(
    dto: CreateAccessProfileDto,
    user: User,
  ): Promise<AccessProfile> {
    const { name, areas, role } = dto;

    const access_profile = this.create({
      name,
      areas,
      role,
      createdByUser: user,
    });

    try {
      return await access_profile.save({
        data: user,
      });
    } catch (e) {
      if (e.sqlState.toString() === '23000') {
        throw new ConflictException('Já existe um perfil com esse nome');
      } else {
        throw new InternalServerError();
      }
    }
  }

  async updateAccessProfile(
    id: number,
    dto: UpdateAccessProfileDto,
    user: User,
  ): Promise<void> {
    const { name, areas, active, role } = dto;

    const accessProfile = await this.findOneById(id);

    if (
      accessProfile.role === ProfileRole.BOLSISTA &&
      user.subRole === SubCredentialRole.ADMIN
    ) {
      throw new ForbiddenError();
    }

    accessProfile.name = name ?? accessProfile.name;
    accessProfile.areas = areas?.length ? areas : accessProfile.areas;
    accessProfile.active = active ?? accessProfile.active;
    accessProfile.role = role ?? accessProfile.role;

    try {
      await accessProfile.save({
        data: user,
      });
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async findOneById(id: number): Promise<AccessProfile | null> {
    const accessProfile = await this.findOne({
      where: {
        id,
      },
      relations: ['areas'],
    });

    if (!accessProfile) {
      return null;
    }

    return accessProfile;
  }

  generalSearchByProfile(
    { limit, page, search }: PaginationParams,
    user: User,
  ) {
    const accessProfile = user?.access_profile;

    const filterRoles = {
      [ProfileRole.ESTADO]: [ProfileRole.REGIONAL, ProfileRole.MUNICIPIO],
      [ProfileRole.REGIONAL]: [ProfileRole.MUNICIPIO, ProfileRole.BOLSISTA],
      [ProfileRole.MUNICIPIO]: [ProfileRole.BOLSISTA],
      [ProfileRole.BOLSISTA]: ['EMPTY'],
    } as const;

    const queryBuilder = this.createQueryBuilder('accessProfile')
      .select(['accessProfile'])
      .leftJoin('accessProfile.areas', 'areas')
      .leftJoin('accessProfile.createdByUser', 'createdByUser')
      .leftJoin('createdByUser.partner_state', 'partner_state')
      .orderBy('accessProfile.name', 'ASC');

    if (user.role === CredentialRole.PARC) {
      queryBuilder.andWhere('accessProfile.role = :role', {
        role: ProfileRole.PARC,
      });
    }

    if (user.role === CredentialRole.ESTADO && user.partner_state) {
      queryBuilder.andWhere('partner_state.id = :idPartnerState', {
        idPartnerState: user.partner_state.id,
      });
    }

    if (search) {
      queryBuilder.andWhere('accessProfile.name LIKE :q', {
        q: `%${search}%`,
      });
    }

    if (
      user.subRole === SubCredentialRole.ADMIN &&
      user.role === CredentialRole.ESTADO
    ) {
      queryBuilder.andWhere(`accessProfile.role != '${ProfileRole.BOLSISTA}'`);
    }

    if (
      accessProfile?.role === ProfileRole.REGIONAL ||
      accessProfile?.role === ProfileRole.MUNICIPIO
    ) {
      queryBuilder.andWhere(
        'createdByUser.regionalPartnerId = :regionalPartnerId',
        {
          regionalPartnerId: user?.regionalPartnerId,
        },
      );
    }

    if (
      user.subRole !== SubCredentialRole.ADMIN &&
      user.role === CredentialRole.ESTADO
    ) {
      const roles = filterRoles[accessProfile?.role] ?? [];

      queryBuilder.andWhere(`accessProfile.role IN(:...roles)`, { roles });
    }

    return paginateData(+page, +limit, queryBuilder);
  }

  paginateForEditUsers(
    { limit, page, search, forApproveScholar }: PaginationParams,
    user: User,
  ) {
    const accessProfile = user?.access_profile;

    const rolesState = forApproveScholar
      ? [ProfileRole.REGIONAL, ProfileRole.MUNICIPIO]
      : [ProfileRole.REGIONAL, ProfileRole.MUNICIPIO];

    const rolesRegional = forApproveScholar
      ? [ProfileRole.MUNICIPIO, ProfileRole.BOLSISTA]
      : [ProfileRole.MUNICIPIO];

    const rolesCounty = forApproveScholar ? [ProfileRole.BOLSISTA] : ['EMPTY'];

    const filterRoles = {
      [ProfileRole.ESTADO]: rolesState,
      [ProfileRole.REGIONAL]: rolesRegional,
      [ProfileRole.MUNICIPIO]: rolesCounty,
      [ProfileRole.BOLSISTA]: ['EMPTY'],
    } as const;

    const queryBuilder = this.createQueryBuilder('accessProfile')
      .leftJoin('accessProfile.createdByUser', 'createdByUser')
      .leftJoin('createdByUser.partner_state', 'partner_state')
      .where('accessProfile.active = TRUE')
      .orderBy('accessProfile.name', 'ASC');

    if (!forApproveScholar) {
      queryBuilder.andWhere(`accessProfile.role != '${ProfileRole.BOLSISTA}'`);
    }

    if (user.role === CredentialRole.PARC) {
      queryBuilder.andWhere('accessProfile.role = :role', {
        role: ProfileRole.PARC,
      });
    }

    if (user.role === CredentialRole.ESTADO && user.partner_state) {
      queryBuilder.andWhere('partner_state.id = :idPartnerState', {
        idPartnerState: user.partner_state.id,
      });
    }

    if (search) {
      queryBuilder.andWhere('accessProfile.name LIKE :q', {
        q: `%${search}%`,
      });
    }

    if (
      accessProfile?.role === ProfileRole.REGIONAL ||
      accessProfile?.role === ProfileRole.MUNICIPIO
    ) {
      queryBuilder.andWhere(
        'createdByUser.regionalPartnerId = :regionalPartnerId',
        {
          regionalPartnerId: user?.regionalPartnerId,
        },
      );
    }

    if (
      user.subRole !== SubCredentialRole.ADMIN &&
      user.role === CredentialRole.ESTADO
    ) {
      const roles = filterRoles[accessProfile?.role] ?? [];

      queryBuilder.andWhere(`accessProfile.role IN(:...roles)`, { roles });
    }

    return paginateData(+page, +limit, queryBuilder);
  }

  paginate(
    {
      limit,
      page,
      search,
      order,
      accessProfileRole,
      column,
      status,
      forApproveScholar,
    }: PaginationParams,
    user: User,
  ) {
    const accessProfile = user?.access_profile;
    const rolesRegional = forApproveScholar
      ? [ProfileRole.REGIONAL, ProfileRole.MUNICIPIO, ProfileRole.BOLSISTA]
      : [ProfileRole.MUNICIPIO, ProfileRole.BOLSISTA];

    const filterRoles = {
      [ProfileRole.ESTADO]: [ProfileRole.REGIONAL, ProfileRole.MUNICIPIO],
      [ProfileRole.REGIONAL]: rolesRegional,
      [ProfileRole.MUNICIPIO]: [ProfileRole.BOLSISTA],
      [ProfileRole.BOLSISTA]: ['EMPTY'],
    } as const;

    const queryBuilder = this.createQueryBuilder('accessProfile')
      .select([
        'accessProfile',
        'areas',
        'createdByUser.id',
        'createdByUser.name',
      ])
      .leftJoin('accessProfile.areas', 'areas')
      .leftJoin('accessProfile.createdByUser', 'createdByUser')
      .leftJoin('createdByUser.partner_state', 'partner_state')
      .orderBy('accessProfile.name', order);

    if (user.role === CredentialRole.PARC) {
      queryBuilder.andWhere('accessProfile.role = :role', {
        role: ProfileRole.PARC,
      });
    }

    if (user.role === CredentialRole.ESTADO && user.partner_state) {
      queryBuilder.andWhere('partner_state.id = :idPartnerState', {
        idPartnerState: user.partner_state.id,
      });
    }

    if (accessProfileRole) {
      queryBuilder.andWhere('accessProfile.role = :role', {
        role: accessProfileRole,
      });
    }

    if (status) {
      queryBuilder.andWhere('accessProfile.active = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere('accessProfile.name LIKE :q', {
        q: `%${search}%`,
      });
    }

    switch (column) {
      case 'role':
        queryBuilder.orderBy('accessProfile.role', order);
        break;
      default:
        queryBuilder.orderBy('accessProfile.name', order);
        break;
    }

    if (
      !forApproveScholar &&
      (accessProfile?.role === ProfileRole.REGIONAL ||
        accessProfile?.role === ProfileRole.MUNICIPIO)
    ) {
      queryBuilder.andWhere(
        'createdByUser.regionalPartnerId = :regionalPartnerId',
        {
          regionalPartnerId: user?.regionalPartnerId,
        },
      );
    }

    if (forApproveScholar && accessProfile?.role === ProfileRole.REGIONAL) {
      queryBuilder.andWhere(
        '((accessProfile.role = :roleRegional) or (createdByUser.regionalPartnerId = :regionalPartnerId AND accessProfile.role IN(:...roles)))',
        {
          roleRegional: ProfileRole.REGIONAL,
          roles: [ProfileRole.MUNICIPIO, ProfileRole.BOLSISTA],
          regionalPartnerId: user?.regionalPartnerId,
        },
      );
    }

    if (
      user.subRole !== SubCredentialRole.ADMIN &&
      user.role === CredentialRole.ESTADO
    ) {
      const roles = filterRoles[accessProfile?.role] ?? [];

      queryBuilder.andWhere(`accessProfile.role IN(:...roles)`, { roles });
    }

    return paginateData(+page, +limit, queryBuilder);
  }

  async findOneByIdWithUsersActive(id: number): Promise<AccessProfile> {
    const accessProfile = await this.createQueryBuilder('accessProfile')
      .leftJoinAndSelect('accessProfile.users', 'users', 'users.active = TRUE')
      .where('accessProfile.id = :id', { id })
      .getOne();

    return accessProfile;
  }
}
