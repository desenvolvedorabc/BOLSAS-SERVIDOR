import { paginateData } from 'src/helpers/return-data-paginate';
import { User } from 'src/modules/user/model/entities/user.entity';
import { InternalServerError } from 'src/shared/errors';
import { EntityRepository, Repository } from 'typeorm';
import { CreateWorkPlanDto } from '../dto/create-work-plan.dto';
import { PaginationParamsWorkPlans } from '../dto/pagination-params-work-plans.dto';
import { WorkPlan } from '../entities/work-plan.entity';
import { WorkPlanStatus } from '../enum/work-plan-status.enum';
import { NotFoundWorkPlanError } from '../errors/not-found-work-plan-erro';
import { ProfileRole } from 'src/modules/profile/model/enum/profile-role';

@EntityRepository(WorkPlan)
export class WorkPlansRepository extends Repository<WorkPlan> {
  async _create(
    createWorkPlanDto: CreateWorkPlanDto,
    user: User,
  ): Promise<WorkPlan> {
    const { generalObjectives, justification, specificObjectives } =
      createWorkPlanDto;

    const workPlan = this.create({
      generalObjectives,
      justification,
      specificObjectives,
      scholar: user,
    });

    try {
      return await this.save(workPlan, {
        data: user,
      });
    } catch (err) {
      throw new InternalServerError();
    }
  }

  async findOneById(id: number, user: User): Promise<WorkPlan> {
    const workPlan = await this.findOne({
      where: {
        id,
        scholar: {
          id: user.id,
        },
      },
      relations: ['schedules'],
    });

    if (!workPlan) {
      throw new NotFoundWorkPlanError();
    }

    return workPlan;
  }

  async _update(workPlan: WorkPlan, user: User): Promise<WorkPlan> {
    try {
      return await this.save(workPlan, {
        data: user,
      });
    } catch (err) {
      throw new InternalServerError();
    }
  }

  paginate(paginationParams: PaginationParamsWorkPlans, user: User) {
    const { limit, page, search, referenceYear, status } = paginationParams;

    const accessProfile = user?.access_profile;

    const queryBuilder = this.createQueryBuilder('workPlans')
      .select(['workPlans', 'scholar.name'])
      .leftJoin('workPlans.scholar', 'scholar')
      .leftJoin('scholar.partner_state', 'partnerState')
      .where('partnerState.id = :idPartnerState', {
        idPartnerState: user.partner_state.id,
      })
      .andWhere('scholar.id != :userId', { userId: user.id })
      .andWhere('workPlans.status != :pending', {
        pending: WorkPlanStatus.PENDENTE_ENVIO,
      })
      .andWhere('scholar.active = TRUE')
      .orderBy('workPlans.createdAt', 'DESC');

    if (search) {
      queryBuilder.andWhere(
        'scholar.name LIKE :search OR scholar.cpf LIKE :search',
        { search: `%${search}%` },
      );
    }

    if (referenceYear) {
      queryBuilder.andWhere('YEAR(workPlans.createdAt) = :referenceYear', {
        referenceYear,
      });
    }

    if (status) {
      queryBuilder.andWhere('workPlans.status = :status', {
        status,
      });
    }

    if (accessProfile?.role === ProfileRole.MUNICIPIO) {
      queryBuilder.andWhere('scholar.city = :city', { city: user.city });
    }

    if (accessProfile?.role === ProfileRole.REGIONAL) {
      queryBuilder.andWhere('scholar.regionalPartnerId = :regionalPartnerId', {
        regionalPartnerId: user.regionalPartnerId,
      });
    }

    return paginateData(page, limit, queryBuilder);
  }

  generalSearch(paginationParams: PaginationParamsWorkPlans, user: User) {
    const { limit, page, search } = paginationParams;

    const accessProfile = user?.access_profile;

    const queryBuilder = this.createQueryBuilder('workPlans')
      .select(['workPlans.id', 'workPlans.createdAt', 'scholar.name'])
      .innerJoin('workPlans.scholar', 'scholar')
      .where('scholar.partnerStateId = :idPartnerState', {
        idPartnerState: user.partner_state.id,
      })
      .andWhere('scholar.id != :userId', { userId: user.id })
      .andWhere('workPlans.status = :status', {
        status: WorkPlanStatus.PENDENTE_VALIDACAO,
      })
      .andWhere('scholar.active = TRUE')
      .orderBy('workPlans.createdAt', 'DESC');

    if (search) {
      queryBuilder.andWhere(
        'scholar.name LIKE :search OR scholar.cpf LIKE :search',
        { search: `%${search}%` },
      );
    }

    if (accessProfile?.role === ProfileRole.MUNICIPIO) {
      queryBuilder.andWhere('scholar.city = :city', { city: user.city });
    }

    if (accessProfile?.role === ProfileRole.REGIONAL) {
      queryBuilder.andWhere('scholar.regionalPartnerId = :regionalPartnerId', {
        regionalPartnerId: user.regionalPartnerId,
      });
    }

    return paginateData(page, limit, queryBuilder);
  }
}
