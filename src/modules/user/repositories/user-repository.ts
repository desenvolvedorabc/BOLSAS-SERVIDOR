import { EntityRepository, Repository } from 'typeorm';
import { paginateData } from 'src/helpers/return-data-paginate';
import { PaginationParams } from 'src/helpers/params';
import { User } from '../model/entities/user.entity';
import { CredentialRole } from '../model/enum/role.enum';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  paginate(dto: PaginationParams) {
    const { page, limit, search, order, profile, status, role, partnerState } =
      dto;

    const queryBuilder = this.createQueryBuilder('users')
      .leftJoinAndSelect('users.access_profile', 'access_profile')
      .leftJoinAndSelect('users.partner_state', 'partner_state')
      .orderBy('users.name', order);

    if (role) {
      queryBuilder.andWhere('users.role = :role', { role });
    }

    if (status) {
      queryBuilder.andWhere('users.active = :status', { status });
    }

    if (profile) {
      queryBuilder.andWhere('access_profile.id = :idProfile', {
        idProfile: profile,
      });
    }

    if (partnerState) {
      queryBuilder.andWhere('partner_state.id = :idPartnerState', {
        idPartnerState: partnerState,
      });
    }

    if (search) {
      queryBuilder.andWhere('users.name LIKE :q', {
        q: `%${search}%`,
      });
    }

    return paginateData(+page, +limit, queryBuilder);
  }

  async findOneById(id: number): Promise<User | null> {
    const user = await this.findOne({
      where: {
        id,
      },
      relations: ['access_profile', 'partner_state'],
    });

    if (!user) {
      return null;
    }

    return user;
  }

  findAllByRole(role: CredentialRole): Promise<User[]> {
    return this.find({
      where: {
        role,
      },
      order: {
        name: 'ASC',
      },
      relations: ['access_profile', 'partner_state'],
    });
  }
}
