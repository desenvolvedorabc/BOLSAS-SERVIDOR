import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccessProfile } from '../model/entities/access-profile.entity';
import { CreateAccessProfileDto } from '../model/dto/create-access-profile.dto';
import { CreateAreaDto } from '../model/dto/create-area.dto';
import { User } from 'src/modules/user/model/entities/user.entity';
import { PaginationParams } from 'src/helpers/params';
import { UpdateAccessProfileDto } from '../model/dto/update-access-profile.dto';
import { CredentialRole } from 'src/modules/user/model/enum/role.enum';
import { BadRequestException } from '@nestjs/common/exceptions';
import { AccessProfileRepository } from '../repositories/access-profile-repository';
import { AreaProfileRepository } from '../repositories/area-profile-repository';
import { InternalServerError } from 'src/shared/errors';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(AccessProfileRepository)
    private accessProfileRepository: AccessProfileRepository,

    @InjectRepository(AreaProfileRepository)
    private readonly areaRepository: AreaProfileRepository,
  ) {}

  async createAccessProfile(
    dto: CreateAccessProfileDto,
    user: User,
  ): Promise<void> {
    await this.accessProfileRepository.createAccessProfile(dto, user);
  }

  async updateAccessProfile(
    id: number,
    dto: UpdateAccessProfileDto,
    user: User,
  ): Promise<void> {
    if (dto.active === false) {
      if (user?.access_profile?.id === id) {
        throw new BadRequestException(
          'Você não pode inativar seu próprio perfil de acesso!',
        );
      }

      await this.verifyExistsUsersActive(id);
    }

    await this.accessProfileRepository.updateAccessProfile(id, dto, user);
  }

  generalSearchByProfile(params: PaginationParams, user: User) {
    return this.accessProfileRepository.generalSearchByProfile(params, user);
  }

  paginateForEditUsers(params: PaginationParams, user: User) {
    return this.accessProfileRepository.paginateForEditUsers(params, user);
  }

  paginateAccessProfile(params: PaginationParams, user: User) {
    return this.accessProfileRepository.paginate(params, user);
  }

  async findOneAccessProfile(id: number): Promise<AccessProfile> {
    const accessProfile = await this.accessProfileRepository.findOneById(id);

    if (!accessProfile) {
      throw new NotFoundException('Perfil de acesso não encontrado');
    }

    return accessProfile;
  }

  async findOneAccessProfileByIdAndPartnerState(
    id: number,
    idPartnerState: number,
  ): Promise<AccessProfile> {
    console.log(idPartnerState);

    const accessProfile = await this.accessProfileRepository
      .createQueryBuilder('accessProfile')
      .leftJoin('accessProfile.createdByUser', 'createdByUser')
      .leftJoin('createdByUser.partner_state', 'partnerState')
      .where('accessProfile.id = :id', { id })
      .andWhere('partnerState.id = :idPartnerState', { idPartnerState })
      .getOne();

    if (!accessProfile) {
      throw new NotFoundException('Perfil de acesso não encontrado');
    }

    return accessProfile;
  }

  async createArea(dto: CreateAreaDto): Promise<void> {
    await this.areaRepository.createArea(dto);
  }

  async verifyExistsUsersActive(id: number): Promise<void> {
    const accessProfile =
      await this.accessProfileRepository.findOneByIdWithUsersActive(id);

    if (accessProfile.users.length) {
      throw new BadRequestException(
        'Você não pode inativar um perfil de acesso com usuários ativos',
      );
    }
  }

  findAreasAll(role: CredentialRole) {
    return this.areaRepository.findAllByRole(role);
  }
}
