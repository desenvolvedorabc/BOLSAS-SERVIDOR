import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../model/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserStateDto } from '../model/dto/create-user-state';
import { hashPassword } from 'src/helpers/crypto';
import { paginateData } from 'src/helpers/return-data-paginate';
import { PaginationParams } from 'src/helpers/params';
import { RegionalPartnersService } from 'src/modules/regional-partners/regional-partners.service';
import { CredentialRole } from '../model/enum/role.enum';
import { ProfileService } from 'src/modules/profile/service/profile.service';
import { UserService } from './user.service';
import { SubCredentialRole } from '../model/enum/sub-role.enum';
import { Workbook, Worksheet } from 'exceljs';
import { Response } from 'express';
import { UpdateUserStateDto } from '../model/dto/update-user-state';
import { ForbiddenError, InternalServerError } from 'src/shared/errors';
import { ConflictError } from '../errors/conflict-error';
import { ProfileRole } from 'src/modules/profile/model/enum/profile-role';
import { NotFoundUserError } from '../errors';

const RolesByProfile = {
  [ProfileRole.ESTADO]: [ProfileRole.REGIONAL, ProfileRole.ESTADO],
  [ProfileRole.REGIONAL]: [
    ProfileRole.REGIONAL,
    ProfileRole.MUNICIPIO,
    ProfileRole.BOLSISTA,
  ],
  [ProfileRole.MUNICIPIO]: [ProfileRole.REGIONAL, ProfileRole.MUNICIPIO],
};

@Injectable()
export class UsersStateService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    private usersService: UserService,
    private readonly regionalPartnerService: RegionalPartnersService,
    private readonly profileService: ProfileService,
  ) {}

  async create(dto: CreateUserStateDto, userAuth: User) {
    const {
      email,
      name,
      cpf,
      telephone,
      idAccessProfile,
      city,
      idRegional,
      subRole,
    } = dto;

    const password = String(new Date());
    const hashedPassword = await hashPassword(String(password));

    const partnerState = userAuth.partner_state;

    await this.usersService.verifyExistsUser({
      email,
      telephone,
      cpf,
      role: CredentialRole.ESTADO,
      partnerStateId: partnerState.id,
    });

    let user = this.userRepository.create({
      name,
      email,
      cpf,
      role: CredentialRole.ESTADO,
      telephone,
      password: hashedPassword,
      subRole: subRole ?? SubCredentialRole.USER,
      partner_state: partnerState,
      city,
    });

    if (idAccessProfile) {
      const accessProfile =
        await this.profileService.findOneAccessProfileByIdAndPartnerState(
          idAccessProfile,
          partnerState.id,
        );

      user.access_profile = accessProfile;
    }

    if (idRegional) {
      const regionalPartner = await this.regionalPartnerService.findOneById(
        idRegional,
        partnerState.id,
      );

      user.regionalPartner = regionalPartner;
    }

    try {
      user = await user.save({
        data: userAuth,
      });

      this.usersService.welcomePasswordChangeLink(user.id);

      delete user.password;

      return user;
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async findOne(id: number, relations = []): Promise<{ user: User }> {
    const user = await this.userRepository.findOne({
      where: {
        id,
        role: CredentialRole.ESTADO,
      },
      relations,
    });

    if (!user) {
      throw new NotFoundUserError();
    }

    return {
      user,
    };
  }

  async updateChangeAdminForScholar(id: number): Promise<void> {
    await this.userRepository.update(id, {
      access_profile: null,
      subRole: SubCredentialRole.BOLSISTA,
    });
  }

  async inactivate(id: number): Promise<void> {
    const { user } = await this.findOne(id);

    try {
      await this.userRepository.update(user.id, {
        active: false,
      });
    } catch (err) {
      throw new InternalServerError();
    }
  }

  generalSearch(dto: PaginationParams, user: User) {
    const { page, limit, search } = dto;

    const partnerState = user.partner_state;
    const accessProfile = user?.access_profile;

    const filterRoles = {
      [ProfileRole.ESTADO]: [ProfileRole.REGIONAL, ProfileRole.MUNICIPIO],
      [ProfileRole.REGIONAL]: [ProfileRole.MUNICIPIO, ProfileRole.BOLSISTA],
      [ProfileRole.MUNICIPIO]: [ProfileRole.BOLSISTA],
      [ProfileRole.BOLSISTA]: [ProfileRole.BOLSISTA],
    } as const;

    const queryBuilder = this.userRepository
      .createQueryBuilder('users')
      .select(['users.id', 'users.name'])
      .leftJoin('users.access_profile', 'access_profile')
      .where('users.partnerStateId = :idPartnerState', {
        idPartnerState: partnerState.id,
      })
      .andWhere('users.role = :role', { role: CredentialRole.ESTADO })
      .andWhere('users.subRole != :subRole', {
        subRole: SubCredentialRole.ADMIN,
      })
      .orderBy('users.name', 'ASC');

    if (accessProfile?.role === ProfileRole.MUNICIPIO) {
      queryBuilder
        .andWhere('users.regionalPartnerId = :regionalPartnerId', {
          regionalPartnerId: user.regionalPartnerId,
        })
        .andWhere('users.city = :city', { city: user.city });
    }

    if (accessProfile?.role === ProfileRole.REGIONAL) {
      queryBuilder.andWhere('users.regionalPartnerId = :regionalPartnerId', {
        regionalPartnerId: user.regionalPartnerId,
      });
    }

    if (search) {
      queryBuilder.andWhere('users.name LIKE :q', {
        q: `%${search}%`,
      });
    }

    if (user.subRole !== SubCredentialRole.ADMIN && accessProfile) {
      const roles = filterRoles[accessProfile?.role] ?? [];

      queryBuilder.andWhere(`access_profile.role IN(:...roles)`, { roles });
    }

    if (accessProfile?.role === ProfileRole.BOLSISTA) {
      queryBuilder.andWhere('users.id = :id', {
        id: user.id,
      });
    }

    return paginateData(+page, +limit, queryBuilder);
  }

  paginate(dto: PaginationParams, user: User) {
    const {
      page,
      limit,
      search,
      order,
      profile,
      status,
      role,
      city,
      idRegionalPartner,
      profileType,
    } = dto;

    const partnerState = user.partner_state;
    const accessProfile = user?.access_profile;

    const filterRoles = {
      [ProfileRole.ESTADO]: [ProfileRole.REGIONAL, ProfileRole.MUNICIPIO],
      [ProfileRole.REGIONAL]: [ProfileRole.MUNICIPIO, ProfileRole.BOLSISTA],
      [ProfileRole.MUNICIPIO]: [ProfileRole.BOLSISTA],
      [ProfileRole.BOLSISTA]: ['EMPTY'],
    } as const;

    const queryBuilder = this.userRepository
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.access_profile', 'access_profile')
      .leftJoinAndSelect('users.partner_state', 'partner_state')
      .leftJoinAndSelect('users.regionalPartner', 'regionalPartner')
      .where('partner_state.id = :idPartnerState', {
        idPartnerState: partnerState.id,
      })
      .andWhere('users.role = :role', { role: CredentialRole.ESTADO })
      .andWhere('users.subRole != :subRole', {
        subRole: SubCredentialRole.ADMIN,
      })
      .andWhere('users.id != :userId', { userId: user.id })
      .orderBy('users.name', order);

    if (role) {
      queryBuilder.andWhere('users.role = :role', { role });
    }

    if (city) {
      queryBuilder.andWhere('users.city = :city', {
        city,
      });
    }

    if (idRegionalPartner) {
      queryBuilder.andWhere('regionalPartner.id = :idRegionalPartner', {
        idRegionalPartner,
      });
    }

    if (status) {
      queryBuilder.andWhere('users.active = :status', { status });
    }

    if (profile) {
      queryBuilder.andWhere('access_profile.id = :idProfile', {
        idProfile: profile,
      });
    }

    if (profileType) {
      if (profileType === SubCredentialRole.BOLSISTA) {
        queryBuilder.andWhere('users.subRole = :profileType', {
          profileType: SubCredentialRole.BOLSISTA,
        });
      } else {
        queryBuilder.andWhere('users.subRole != :profileType', {
          profileType: SubCredentialRole.BOLSISTA,
        });
      }
    }

    if (accessProfile?.role === ProfileRole.MUNICIPIO) {
      queryBuilder
        .andWhere('regionalPartner.id = :regionalPartnerId', {
          regionalPartnerId: user.regionalPartnerId,
        })
        .andWhere('users.city = :city', { city: user.city });
    }

    if (accessProfile?.role === ProfileRole.REGIONAL) {
      queryBuilder.andWhere('regionalPartner.id = :regionalPartnerId', {
        regionalPartnerId: user.regionalPartnerId,
      });
    }

    if (search) {
      queryBuilder.andWhere('users.name LIKE :q', {
        q: `%${search}%`,
      });
    }

    if (user.subRole !== SubCredentialRole.ADMIN && accessProfile) {
      const roles = filterRoles[accessProfile?.role] ?? [];

      queryBuilder.andWhere(`access_profile.role IN(:...roles)`, { roles });
    }

    return paginateData(+page, +limit, queryBuilder);
  }

  getForNotifications(dto: PaginationParams, user: User) {
    const { page, limit, search, order, city, idRegionalPartner } = dto;

    const partnerState = user.partner_state;
    const accessProfile = user?.access_profile;

    const queryBuilder = this.userRepository
      .createQueryBuilder('users')
      .select(['users.id', 'users.name', 'users.email'])
      .leftJoin('users.access_profile', 'access_profile')
      .innerJoin('users.partner_state', 'partner_state')
      .leftJoin('users.regionalPartner', 'regionalPartner')
      .where('partner_state.id = :idPartnerState', {
        idPartnerState: partnerState.id,
      })
      .andWhere('users.active = TRUE')
      .andWhere('users.role = :role', { role: CredentialRole.ESTADO })
      .andWhere('users.id != :userId', { userId: user.id })
      .orderBy('users.name', order);

    if (user.subRole === SubCredentialRole.ADMIN) {
      queryBuilder.andWhere(
        '(users.subRole = :subRole AND access_profile.role = :accessProfileRole)',
        {
          subRole: SubCredentialRole.USER,
          accessProfileRole: ProfileRole.ESTADO,
        },
      );
    } else {
      if (accessProfile?.role) {
        if (
          accessProfile?.role === ProfileRole.REGIONAL ||
          accessProfile?.role === ProfileRole.MUNICIPIO
        ) {
          queryBuilder.andWhere('regionalPartner.id = :regionalPartnerId', {
            regionalPartnerId: user.regionalPartnerId,
          });
        }

        if (accessProfile?.role === ProfileRole.ESTADO) {
          if (idRegionalPartner) {
            queryBuilder.andWhere('regionalPartner.id = :idRegionalPartner', {
              idRegionalPartner,
            });
          }

          queryBuilder.andWhere(
            '(users.subRole = :subRole OR access_profile.role = :accessProfileRole)',
            {
              subRole: SubCredentialRole.ADMIN,
              accessProfileRole: ProfileRole.REGIONAL,
            },
          );
        } else if (accessProfile?.role === ProfileRole.REGIONAL) {
          if (city) {
            queryBuilder.andWhere('users.city = :city', {
              city,
            });
          }

          queryBuilder.andWhere('access_profile.role IN(:...roles)', {
            roles: [ProfileRole.ESTADO, ProfileRole.MUNICIPIO],
          });
        } else if (accessProfile?.role === ProfileRole.MUNICIPIO) {
          queryBuilder.andWhere(
            `((access_profile.role = '${ProfileRole.REGIONAL}') OR (users.subRole = '${ProfileRole.BOLSISTA}' AND users.city = '${user?.city}' AND access_profile.role = '${ProfileRole.BOLSISTA}'))`,
          );
        }
      }
    }

    if (search) {
      queryBuilder.andWhere('users.name LIKE :q', {
        q: `%${search}%`,
      });
    }

    return paginateData(+page, +limit, queryBuilder);
  }

  async update(
    id: number,
    dto: UpdateUserStateDto,
    userAuth: User,
  ): Promise<User> {
    const { idAccessProfile, idRegional } = dto;

    const user = await this.usersService.findOne(id);

    if (
      user.subRole === SubCredentialRole.BOLSISTA &&
      userAuth.subRole === SubCredentialRole.ADMIN
    ) {
      throw new ForbiddenError();
    }

    let regionalPartner = user.regionalPartner;
    let accessProfile = user.access_profile;

    await this.usersService.verifyExistsUser({
      cpf: dto?.cpf,
      email: dto?.email,
      telephone: dto?.telephone,
      role: CredentialRole.ESTADO,
      userId: id,
      partnerStateId: user.partner_state.id,
    });

    if (idAccessProfile && idAccessProfile !== accessProfile?.id) {
      accessProfile =
        await this.profileService.findOneAccessProfileByIdAndPartnerState(
          idAccessProfile,
          user.partner_state.id,
        );
    }

    if (idRegional && idRegional !== regionalPartner?.id) {
      regionalPartner = await this.regionalPartnerService.findOneById(
        idRegional,
        user.partner_state.id,
      );
    }

    const formattedDto = {
      ...user,
      ...dto,
      access_profile: accessProfile,
      regionalPartner,
    };

    try {
      return await this.userRepository.save(formattedDto, {
        data: userAuth,
      });
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async getExcelUsers(
    paginationParams: PaginationParams,
    response: Response<unknown, Record<string, unknown>>,
    user: User,
  ): Promise<Worksheet> {
    const params = {
      ...paginationParams,
      role: CredentialRole.ESTADO,
      page: 1,
      limit: 9999999,
    };

    const { items: users } = await this.paginate(
      params as PaginationParams,
      user,
    );

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Usuários Admin');

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
        header: 'E-mail',
        key: 'email',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Perfil',
        key: 'profile',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Município',
        key: 'city',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Regional',
        key: 'regional',
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

    users.forEach((user) => {
      worksheet.addRow({
        id: user.id,
        name: user?.name ?? '',
        email: user?.email ?? '',
        profile: user?.access_profile?.name ?? '',
        city: user?.city ?? '',
        regional: user?.regionalPartner?.name ?? '',
        status: user.active ? 'Ativo' : 'Inativo',
      });
    });

    try {
      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      response.setHeader(
        'Content-Disposition',
        'attachment; filename=' + 'Relatório_de_usuarios.xlsx',
      );

      await workbook.xlsx.write(response, {
        filename: 'Relatório_de_usuarios.xlsx',
      });

      return worksheet;
    } catch (err) {
      console.log(err);
      throw new InternalServerError();
    }
  }
}
