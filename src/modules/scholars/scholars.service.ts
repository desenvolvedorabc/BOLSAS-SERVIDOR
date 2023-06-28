import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { unlink } from 'node:fs';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationParams } from 'src/helpers/params';
import { paginateData } from 'src/helpers/return-data-paginate';
import { ForbiddenError, InternalServerError } from 'src/shared/errors';
import { Repository } from 'typeorm/repository/Repository';
import { User } from '../user/model/entities/user.entity';
import { SubCredentialRole } from '../user/model/enum/sub-role.enum';
import { UsersStateService } from '../user/service/user-state.service';
import { CreateCompletedScholarDto } from './dto/create-completed-scholar.dto';
import { CreateScholarDto } from './dto/create-scholar.dto';
import { UpdateScholarDto } from './dto/update-scholar.dto';
import { Scholar } from './entities/scholar.entity';
import { RegistrationLevel } from './enum/registration-level.enum';
import { LevelApproveRegistration } from './enum/level-approve-registration.enum';
import { StatusRegistration } from './enum/status-registration.enum';
import { ReproveScholarDto } from './dto/reprove-scholar.dto';
import { ApproveScholarDto } from './dto/approve-scholar.dto';
import { UpdateCompletedScholarDto } from './dto/update-completed-scholar.dto';
import { FilesScholar } from './interfaces/files-scholar.interface';
import { ValidationHistory } from 'src/shared/entities/validation-history.entity';
import { ChangeAdminScholarDto } from './dto/change-admin-scholar.dto';
import { CredentialRole } from '../user/model/enum/role.enum';
import { ProfileRole } from '../profile/model/enum/profile-role';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ScholarsService {
  constructor(
    @InjectRepository(Scholar)
    private readonly scholarsRepository: Repository<Scholar>,

    @InjectRepository(ValidationHistory)
    private readonly validationHistoryRepository: Repository<ValidationHistory>,

    private readonly usersStateService: UsersStateService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createScholarDto: CreateScholarDto, userAuth: User) {
    const { cpf, email, name, telephone, axle, city, idRegional, isFormer } =
      createScholarDto;

    const user = await this.usersStateService.create(
      {
        city,
        cpf,
        email,
        idAccessProfile: null,
        idRegional,
        name,
        telephone,
        subRole: SubCredentialRole.BOLSISTA,
      },
      userAuth,
    );

    const scholar = this.scholarsRepository.create({
      axle,
      user,
      isFormer,
      registrationLevel: RegistrationLevel.PRE_CADASTRO,
      levelApproveRegistration: LevelApproveRegistration.MUNICIPIO,
    });

    try {
      await scholar.save({
        data: userAuth,
      });

      this.notificationsService.preRegistration(user);
      return scholar;
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async changeAdminScholar(
    id: number,
    { isFormer }: ChangeAdminScholarDto,
    userAuth: User,
  ) {
    const accessProfile = userAuth?.access_profile;
    const rolesAccessProfileNotPermission = [
      ProfileRole.MUNICIPIO,
      ProfileRole.BOLSISTA,
    ];

    const levelsPermissionChangeAdmin = {
      [ProfileRole.ESTADO]: ProfileRole.REGIONAL,
      [ProfileRole.REGIONAL]: ProfileRole.MUNICIPIO,
    };

    if (
      userAuth.subRole === SubCredentialRole.ADMIN ||
      rolesAccessProfileNotPermission.includes(accessProfile?.role)
    ) {
      throw new ForbiddenError(
        'Você não tem permissão para transformar um usuário admin em bolsista.',
      );
    }

    const { user } = await this.usersStateService.findOne(id, [
      'access_profile',
    ]);

    if (
      user.role === CredentialRole.PARC ||
      user.subRole === SubCredentialRole.ADMIN ||
      levelsPermissionChangeAdmin[accessProfile?.role] !==
        user?.access_profile?.role ||
      !user.active
    ) {
      throw new ForbiddenError();
    }

    const { scholar: findScholar } = await this.me(user, []);

    if (findScholar) {
      throw new ForbiddenException('Esse usuário já é um bolsista.');
    }

    const scholar = this.scholarsRepository.create({
      user,
      registrationLevel: RegistrationLevel.PRE_CADASTRO,
      isFormer,
      levelApproveRegistration: LevelApproveRegistration.MUNICIPIO,
    });

    try {
      await this.usersStateService.updateChangeAdminForScholar(id);
      await this.scholarsRepository.save(scholar, {
        data: userAuth,
      });

      this.notificationsService.preRegistration(user);
    } catch (err) {
      throw new InternalServerError();
    }
  }

  async completedScholar(
    dto: CreateCompletedScholarDto,
    user: User,
    files: FilesScholar,
  ) {
    const { scholar } = await this.me(user);

    const newScholar = Object.assign(scholar, {
      ...scholar,
      ...dto,
      registrationLevel: RegistrationLevel.CADASTRO_COMPLETO,
    });

    this.addFilesInScholar(files, newScholar);

    try {
      await this.scholarsRepository.save(newScholar);
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async me(
    user: User,
    relations = [
      'validationHistoryCounty',
      'validationHistoryRegional',
      'validationHistoryCounty.user',
      'validationHistoryRegional.user',
    ],
  ) {
    const scholar = await this.scholarsRepository.findOne({
      where: {
        user: {
          id: user.id,
        },
      },
      relations,
    });

    return {
      scholar,
    };
  }

  async findOneByReport(id: number) {
    const scholar = await this.scholarsRepository.findOne({
      where: {
        id,
      },
      relations: [
        'user',
        'user.access_profile',
        'user.regionalPartner',
        'validationHistoryCounty',
        'validationHistoryRegional',
        'validationHistoryCounty.user',
        'validationHistoryRegional.user',
      ],
    });

    if (!scholar) {
      throw new NotFoundException('Bolsista não encontrado');
    }

    return scholar;
  }

  async updateWithUser(
    id: number,
    updateScholarDto: UpdateScholarDto,
    user: User,
  ): Promise<void> {
    const scholar = await this.findOne(id);

    try {
      await this.usersStateService.update(
        scholar.user.id,
        updateScholarDto,
        user,
      );
      if (updateScholarDto?.axle?.trim()) {
        await this.scholarsRepository.update(id, {
          axle: updateScholarDto.axle,
        });
      }
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async meForReports(user: User) {
    const scholar = await this.scholarsRepository.findOne({
      where: {
        user: {
          id: user.id,
        },
      },
    });

    if (!scholar) {
      throw new NotFoundException('Bolsista não encontrado');
    }

    return {
      scholar,
    };
  }

  getScholarsForTermsOfMembership(
    paginationParams: PaginationParams,
    user: User,
  ) {
    const { page, limit, order, search } = paginationParams;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessProfile: any = user?.access_profile;

    const queryBuilder = this.scholarsRepository
      .createQueryBuilder('Scholar')
      .select([
        'Scholar.id',
        'Scholar.axle',
        'user.id',
        'user.name',
        'user.cpf',
        'user.city',
      ])
      .innerJoin('Scholar.user', 'user')
      .leftJoin('user.regionalPartner', 'regionalPartner')
      .leftJoin('user.partner_state', 'partner_state')
      .innerJoin('user.access_profile', 'access_profile')
      .where('partner_state.id = :idPartnerState', {
        idPartnerState: user.partner_state.id,
      })
      .andWhere('user.active = TRUE')
      .orderBy('user.name', order);

    if (search) {
      queryBuilder.andWhere(
        '(user.name LIKE :search OR user.cpf LIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    if (accessProfile?.role === LevelApproveRegistration.MUNICIPIO) {
      queryBuilder.andWhere('user.city = :city', { city: user.city });
    }

    if (accessProfile?.role === LevelApproveRegistration.REGIONAL) {
      queryBuilder.andWhere('regionalPartner.id = :regionalPartnerId', {
        regionalPartnerId: user.regionalPartnerId,
      });
    }

    return paginateData(+page, +limit, queryBuilder);
  }

  async getAllInPreRegistration(
    paginationParams: PaginationParams,
    user: User,
  ) {
    const { page, limit, order, search, city } = paginationParams;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessProfile: any = user?.access_profile;

    const levelsApprove = {
      [LevelApproveRegistration.MUNICIPIO]:
        'Scholar.validationHistoryCounty IS NOT NULL',
      [LevelApproveRegistration.REGIONAL]:
        'Scholar.validationHistoryRegional IS NOT NULL',
    };

    const levelValidate =
      levelsApprove[accessProfile?.role] ??
      'Scholar.levelApproveRegistration IS NOT NULL';

    const queryBuilder = this.scholarsRepository
      .createQueryBuilder('Scholar')
      .select([
        'Scholar.id',
        'Scholar.statusRegistration',
        'Scholar.levelApproveRegistration',
        'user.id',
        'user.name',
        'user.cpf',
        'user.email',
        'user.city',
        'regionalPartner.id',
        'regionalPartner.name',
      ])
      .leftJoin('Scholar.user', 'user')
      .leftJoin('user.regionalPartner', 'regionalPartner')
      .leftJoin('user.partner_state', 'partner_state')
      .where('partner_state.id = :idPartnerState', {
        idPartnerState: user.partner_state.id,
      })
      .andWhere('user.active = TRUE')
      .andWhere(
        `Scholar.registrationLevel = '${RegistrationLevel.CADASTRO_COMPLETO}'`,
      )
      .andWhere(
        `Scholar.statusRegistration != '${StatusRegistration.PENDENTE_ENVIO}'`,
      )
      .andWhere(
        `(Scholar.levelApproveRegistration = '${accessProfile?.role}' OR ${levelValidate})`,
      )
      .orderBy('user.name', order);

    if (search) {
      queryBuilder.andWhere('user.name LIKE :search', {
        search: `%${search}%`,
      });
    }

    if (city) {
      queryBuilder.andWhere('user.city = :city', { city });
    }

    if (accessProfile?.role === LevelApproveRegistration.MUNICIPIO) {
      queryBuilder.andWhere('user.city = :city', { city: user.city });
    }

    if (accessProfile?.role === LevelApproveRegistration.REGIONAL) {
      queryBuilder.andWhere('regionalPartner.id = :regionalPartnerId', {
        regionalPartnerId: user.regionalPartnerId,
      });
    }

    const data = await paginateData(+page, +limit, queryBuilder);

    const items = data.items.map((item) => {
      let statusRegistration = item.statusRegistration;
      if (levelsApprove[accessProfile?.role]) {
        statusRegistration =
          accessProfile?.role === item.levelApproveRegistration
            ? item.statusRegistration
            : StatusRegistration.APROVADO;
      }

      return {
        ...item,
        statusRegistration,
      };
    });

    return {
      ...data,
      items,
    };
  }

  generalSearch(paginationParams: PaginationParams, user: User) {
    const { page, limit, search } = paginationParams;

    const accessProfile = user?.access_profile;

    const queryBuilder = this.scholarsRepository
      .createQueryBuilder('Scholar')
      .select(['Scholar.id', 'user.id', 'user.name'])
      .innerJoin('Scholar.user', 'user')
      .where('user.partnerStateId = :partnerStateId', {
        partnerStateId: user.partner_state.id,
      })
      .andWhere('user.active = TRUE')
      .andWhere(
        `Scholar.registrationLevel = '${RegistrationLevel.CADASTRO_COMPLETO}'`,
      )
      .andWhere(
        `Scholar.statusRegistration = '${StatusRegistration.PENDENTE_VALIDACAO}'`,
      )
      .andWhere(`Scholar.levelApproveRegistration = '${accessProfile?.role}'`)
      .orderBy('user.name', 'DESC');

    if (search) {
      queryBuilder.andWhere('user.name LIKE :search', {
        search: `%${search}%`,
      });
    }

    if (accessProfile?.role === ProfileRole.MUNICIPIO) {
      queryBuilder.andWhere('user.city = :city', { city: user.city });
    }

    if (accessProfile?.role === ProfileRole.REGIONAL) {
      queryBuilder.andWhere('user.regionalPartnerId = :regionalPartnerId', {
        regionalPartnerId: user.regionalPartnerId,
      });
    }

    return paginateData(+page, +limit, queryBuilder);
  }

  async findOne(id: number, relations = ['user']) {
    const scholar = await this.scholarsRepository.findOne({
      where: {
        id,
      },
      relations,
    });

    if (!scholar) {
      throw new NotFoundException('Bolsista não encontrado');
    }

    return scholar;
  }

  async findOneByUser(userId: number, relations = ['user']) {
    const scholar = await this.scholarsRepository.findOne({
      where: {
        userId,
      },
      relations,
    });

    if (!scholar) {
      throw new NotFoundException('Bolsista não encontrado');
    }

    return { scholar };
  }

  async sendForValidation(user: User): Promise<void> {
    const { scholar } = await this.me(user);

    if (!scholar) {
      throw new NotFoundException();
    }

    if (scholar.statusRegistration !== StatusRegistration.PENDENTE_ENVIO) {
      throw new ForbiddenError();
    }

    try {
      await this.scholarsRepository.save({
        ...scholar,
        statusRegistration: StatusRegistration.PENDENTE_VALIDACAO,
      });
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async inValidation(id: number): Promise<void> {
    const scholar = await this.findOne(id);

    if (scholar.statusRegistration !== StatusRegistration.PENDENTE_VALIDACAO) {
      throw new ForbiddenError();
    }

    try {
      await this.scholarsRepository.save({
        ...scholar,
        statusRegistration: StatusRegistration.EM_VALIDACAO,
      });
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async approve(
    id: number,
    approveScholarDto: ApproveScholarDto,
    user: User,
  ): Promise<void> {
    const scholar = await this.findOne(id);

    const accessProfileRole: string = user?.access_profile?.role;
    const statusApprove = [
      StatusRegistration.EM_VALIDACAO,
      StatusRegistration.PENDENTE_VALIDACAO,
    ];

    if (
      !statusApprove.includes(scholar.statusRegistration) ||
      scholar.levelApproveRegistration !== accessProfileRole
    ) {
      throw new ForbiddenError();
    }

    const validationHistory = await this.validationHistoryRepository
      .create({
        user,
        status: StatusRegistration.APROVADO,
      })
      .save();

    if (
      scholar.levelApproveRegistration === LevelApproveRegistration.MUNICIPIO
    ) {
      scholar.validationHistoryCounty = validationHistory;
      scholar.levelApproveRegistration = LevelApproveRegistration.REGIONAL;
      scholar.statusRegistration = StatusRegistration.PENDENTE_VALIDACAO;
    } else {
      scholar.validationHistoryRegional = validationHistory;
      scholar.statusRegistration = StatusRegistration.APROVADO;

      await this.usersStateService.update(
        scholar.user.id,
        {
          ...approveScholarDto,
        },
        user,
      );
    }

    try {
      await this.scholarsRepository.save(scholar);
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async reprove(
    id: number,
    reproveScholarDto: ReproveScholarDto,
    user: User,
  ): Promise<void> {
    const { justification } = reproveScholarDto;
    const scholar = await this.findOne(id);

    const statusReprove = [
      StatusRegistration.EM_VALIDACAO,
      StatusRegistration.PENDENTE_VALIDACAO,
    ];

    const accessProfileRole: string = user?.access_profile?.role;

    if (
      !statusReprove.includes(scholar.statusRegistration) ||
      scholar.levelApproveRegistration !== accessProfileRole
    ) {
      throw new ForbiddenError();
    }

    const editScholar = {
      ...scholar,
      statusRegistration: StatusRegistration.REPROVADO,
    };

    const validationHistory = await this.validationHistoryRepository
      .create({
        user,
        justificationReprove: justification,
        status: StatusRegistration.REPROVADO,
      })
      .save();

    if (
      editScholar.levelApproveRegistration ===
      LevelApproveRegistration.MUNICIPIO
    ) {
      editScholar.validationHistoryCounty = validationHistory;
    } else {
      editScholar.validationHistoryRegional = validationHistory;
    }

    try {
      await this.scholarsRepository.save(editScholar);
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async update(
    id: number,
    updateScholarDto: UpdateCompletedScholarDto,
    files: FilesScholar,
  ) {
    const scholar = await this.findOne(id);

    const statusForUpdate = [
      StatusRegistration.PENDENTE_ENVIO,
      StatusRegistration.PENDENTE_VALIDACAO,
      StatusRegistration.REPROVADO,
    ];

    if (!statusForUpdate.includes(scholar.statusRegistration)) {
      throw new ForbiddenError();
    }

    const updateScholar = Object.assign(scholar, {
      ...scholar,
      ...updateScholarDto,
      statusRegistration: StatusRegistration.PENDENTE_ENVIO,
    });

    this.addFilesInScholar(files, updateScholar);

    try {
      await this.scholarsRepository.save(updateScholar);
    } catch (e) {
      throw new InternalServerError();
    }
  }

  addFilesInScholar(files: FilesScholar, scholar: Scholar): void {
    const keysFiles = Object.keys(files);

    keysFiles.forEach((key) => {
      if (scholar[key]) {
        console.log(scholar[key]);
        unlink(`./public/file/${scholar[key]}`, (err) => {
          console.log(err);
        });
      }

      scholar[key] = files[key][0].filename;
    });
  }
}
