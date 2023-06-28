import { Pagination } from 'nestjs-typeorm-paginate';
import { PaginationParams } from 'src/helpers/params';
import { User } from 'src/modules/user/model/entities/user.entity';
import { CreatePartnerStateDto } from '../dto/create-partner-state.dto';
import { UpdatePartnerStateDto } from '../dto/update-partner-state.dto';
import { PartnerState } from '../entities/partner-state.entity';

export abstract class PartnerStatesRepository {
  abstract create(
    createPartnerStateDto: CreatePartnerStateDto,
    user: User,
  ): Promise<PartnerState>;

  abstract findAll(
    paginationParams: PaginationParams,
  ): Promise<Pagination<PartnerState>>;

  abstract findOne(id: number): Promise<PartnerState>;
  abstract findOneBySlug(slug: string): Promise<PartnerState>;

  abstract verifyExistsUsersInactiveInPartnerState(id: number): Promise<void>;

  abstract update(
    id: number,
    dto: UpdatePartnerStateDto,
    user: User,
  ): Promise<PartnerState>;
}
