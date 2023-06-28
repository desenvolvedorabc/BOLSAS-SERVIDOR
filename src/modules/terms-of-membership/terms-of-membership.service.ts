import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { CreateTermsOfMembershipDto } from './dto/create-terms-of-membership.dto';
import { UpdateTermsOfMembershipDto } from './dto/update-terms-of-membership.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TermsOfMembership } from './entities/terms-of-membership.entity';
import { Repository } from 'typeorm';
import { ForbiddenError, InternalServerError } from 'src/shared/errors';
import { User } from '../user/model/entities/user.entity';
import { ScholarsService } from '../scholars/scholars.service';
import { paginateData } from 'src/helpers/return-data-paginate';
import { PaginationTermsOfMembership } from './dto/pagination-terms-membership.dto';
import { TermOfMembershipStatus } from './enum/status-term-membership.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { ProfileRole } from '../profile/model/enum/profile-role';
import { SystemParametersService } from '../system-parameters/system-parameters.service';
import { MonthlyReportsService } from '../monthly-reports/monthly-reports.service';
import { MonthlyReport } from '../monthly-reports/entities/monthly-report.entity';
import { MonthlyReportStatus } from '../monthly-reports/enum/monthly-report-status.enum';

@Injectable()
export class TermsOfMembershipService {
  constructor(
    @InjectRepository(TermsOfMembership)
    private readonly termsOfMembershipRepository: Repository<TermsOfMembership>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(MonthlyReport)
    private readonly monthlyReportRepository: Repository<MonthlyReport>,

    private readonly scholarsService: ScholarsService,
    private readonly notificationsService: NotificationsService,
    private readonly systemParametersService: SystemParametersService,
  ) {}

  async create(
    createTermsOfMembershipDto: CreateTermsOfMembershipDto,
    user: User,
  ): Promise<void> {
    const {
      axle,
      bagName,
      city,
      contractDescription,
      endDate,
      extensionDate,
      payingSource,
      project,
      scholarshipValue,
      startDate,
      weekHours,
      workUnit,
      scholarId,
    } = createTermsOfMembershipDto;

    const scholar = await this.scholarsService.findOne(scholarId, ['user']);

    await this.verifyScholarExistTerm(scholar.id);

    const scholarshipValueInCents = scholarshipValue * 100;

    const termsOfMembership = this.termsOfMembershipRepository.create({
      axle,
      bagName,
      city,
      contractDescription,
      endDate,
      extensionDate,
      payingSource,
      project,
      scholarshipValueInCents,
      startDate,
      weekHours,
      workUnit,
      scholar,
    });

    try {
      await this.termsOfMembershipRepository.save(termsOfMembership, {
        data: user,
      });
      this.notificationsService.signatureOfTheTerm(scholar.user);
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async verifyScholarExistTerm(scholarId: number): Promise<void> {
    const findTerm = await this.termsOfMembershipRepository.findOne({
      where: {
        scholarId,
      },
    });

    if (findTerm) {
      throw new ConflictException(
        'Bolsista ja tem um termo de compromisso cadastrado.',
      );
    }
  }

  findAll(
    { page, limit, search, city, status }: PaginationTermsOfMembership,
    user: User,
  ) {
    const queryBuilder = this.termsOfMembershipRepository
      .createQueryBuilder('TermsOfMembership')
      .select([
        'TermsOfMembership.id',
        'TermsOfMembership.createdAt',
        'TermsOfMembership.status',
        'Scholar.id',
        'User.id',
        'User.name',
      ])
      .innerJoin('TermsOfMembership.scholar', 'Scholar')
      .innerJoin('Scholar.user', 'User')
      .where('User.partnerStateId = :partnerStateId', {
        partnerStateId: user.partner_state.id,
      })
      .orderBy('TermsOfMembership.createdAt', 'DESC');

    if (user?.regionalPartnerId) {
      queryBuilder.andWhere('User.regionalPartnerId = :regionalPartnerId', {
        regionalPartnerId: user.regionalPartnerId,
      });
    }

    if (search) {
      queryBuilder.andWhere('User.name LIKE :search', {
        search: `%${search}%`,
      });
    }

    if (city) {
      queryBuilder.andWhere('User.city = :city', { city });
    }

    if (status) {
      queryBuilder.andWhere('TermsOfMembership.status = :status', { status });
    }

    return paginateData(+page, +limit, queryBuilder);
  }

  generalSearch(
    { page, limit, search }: PaginationTermsOfMembership,
    user: User,
  ) {
    const queryBuilder = this.termsOfMembershipRepository
      .createQueryBuilder('TermsOfMembership')
      .select([
        'TermsOfMembership.id',
        'TermsOfMembership.createdAt',
        'Scholar.id',
        'User.id',
        'User.name',
      ])
      .innerJoin('TermsOfMembership.scholar', 'Scholar')
      .innerJoin('Scholar.user', 'User')
      .where('User.partnerStateId = :partnerStateId', {
        partnerStateId: user.partner_state.id,
      })
      .andWhere('User.name LIKE :search', {
        search: `%${search}%`,
      })
      .orderBy('TermsOfMembership.createdAt', 'DESC');

    if (user?.regionalPartnerId) {
      queryBuilder.andWhere('User.regionalPartnerId = :regionalPartnerId', {
        regionalPartnerId: user.regionalPartnerId,
      });
    }

    if (user?.access_profile?.role === ProfileRole.BOLSISTA) {
      queryBuilder.andWhere('User.id = :userId', {
        userId: user.id,
      });
    } else {
      queryBuilder.andWhere('TermsOfMembership.status = :status', {
        status: TermOfMembershipStatus.PENDENTE_ASSINATURA,
      });
    }

    return paginateData(+page, +limit, queryBuilder);
  }

  async findOne(id: number) {
    const termsOfMembership = await this.termsOfMembershipRepository
      .createQueryBuilder('TermOfMembership')
      .select([
        'TermOfMembership',
        'Scholar.id',
        'User.id',
        'User.name',
        'User.cpf',
      ])
      .innerJoin('TermOfMembership.scholar', 'Scholar')
      .innerJoin('Scholar.user', 'User')
      .where('TermOfMembership.id = :id', { id })
      .getOne();

    if (!termsOfMembership) {
      throw new NotFoundException(
        'Não há Termo de Compromisso cadastrado para esse usuário.',
      );
    }

    return {
      termsOfMembership,
    };
  }

  async me(userId: number) {
    const termsOfMembership = await this.termsOfMembershipRepository
      .createQueryBuilder('TermOfMembership')
      .innerJoin('TermOfMembership.scholar', 'Scholar')
      .where('Scholar.userId = :userId', { userId })
      .getOne();

    if (!termsOfMembership) {
      throw new NotFoundException(
        'Não há Termo de Compromisso cadastrado para esse usuário.',
      );
    }

    return {
      termsOfMembership,
    };
  }

  async meForReport(userId: number) {
    let termOfMembership = null;

    if (userId) {
      termOfMembership = await this.termsOfMembershipRepository
        .createQueryBuilder('TermOfMembership')
        .innerJoin('TermOfMembership.scholar', 'Scholar')
        .where('Scholar.userId = :userId', { userId })
        .getOne();
    }

    return {
      termOfMembership,
    };
  }

  async toSign(user: User, file: Express.Multer.File): Promise<void> {
    if (!file) {
      throw new BadRequestException('Informe o documento assinado.');
    }

    const { termsOfMembership } = await this.me(user.id);

    if (
      termsOfMembership.status !== TermOfMembershipStatus.PENDENTE_ASSINATURA
    ) {
      throw new ForbiddenError();
    }

    try {
      await this.termsOfMembershipRepository.update(termsOfMembership.id, {
        signedDocument: file.filename,
        signedAt: new Date(),
        status: TermOfMembershipStatus.ASSINADO,
      });

      this.notificationsService.createWorkPlan(user);
    } catch (err) {
      throw new InternalServerError();
    }
  }

  async inactivate(id: number): Promise<void> {
    const { termsOfMembership } = await this.findOne(id);

    if (
      termsOfMembership.status !== TermOfMembershipStatus.PENDENTE_ASSINATURA
    ) {
      throw new ForbiddenError();
    }

    try {
      await this.termsOfMembershipRepository.update(termsOfMembership.id, {
        status: TermOfMembershipStatus.INATIVADO,
      });
    } catch (err) {
      throw new InternalServerError();
    }
  }

  async toCancel(user: User, file: Express.Multer.File): Promise<void> {
    if (!file) {
      throw new BadRequestException('Informe o documento assinado.');
    }

    const { termsOfMembership } = await this.me(user.id);

    if (termsOfMembership.status !== TermOfMembershipStatus.ASSINADO) {
      throw new ForbiddenError();
    }

    const { systemParameter } =
      await this.systemParametersService.findOneByPartnerState(
        user.partnerStateId,
      );

    if (systemParameter) {
      const date = new Date();

      const day = date.getDate();

      if (day < systemParameter.dayLimitForMonthlyReport) {
        throw new ForbiddenError();
      }

      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const { monthlyReport } = await this.getByMonthAndYear(
        month,
        year,
        termsOfMembership.scholarId,
      );

      if (
        !monthlyReport ||
        monthlyReport.status !== MonthlyReportStatus.APROVADO
      ) {
        throw new ForbiddenError();
      }
    }

    try {
      await this.termsOfMembershipRepository.update(termsOfMembership.id, {
        cancelDocument: file.filename,
        cancelAt: new Date(),
        status: TermOfMembershipStatus.CANCELADO,
      });

      await this.usersRepository.update(user.id, {
        active: false,
      });
    } catch (err) {
      throw new InternalServerError();
    }
  }

  async update(
    id: number,
    updateTermsOfMembershipDto: UpdateTermsOfMembershipDto,
    user: User,
  ) {
    const { termsOfMembership } = await this.findOne(id);
    let scholar = termsOfMembership.scholar;
    let isUpdateUser = false;

    if (
      termsOfMembership.status !== TermOfMembershipStatus.PENDENTE_ASSINATURA
    ) {
      throw new ForbiddenError();
    }

    if (
      updateTermsOfMembershipDto?.scholarId &&
      updateTermsOfMembershipDto?.scholarId !== termsOfMembership.scholarId
    ) {
      const findScholar = await this.scholarsService.findOne(
        updateTermsOfMembershipDto?.scholarId,
        ['user'],
      );

      await this.verifyScholarExistTerm(updateTermsOfMembershipDto?.scholarId);
      scholar = findScholar;
      isUpdateUser = true;
    }

    const scholarshipValueInCents = updateTermsOfMembershipDto.scholarshipValue
      ? updateTermsOfMembershipDto.scholarshipValue * 100
      : termsOfMembership.scholarshipValueInCents;

    delete updateTermsOfMembershipDto?.scholarshipValue;

    try {
      await this.termsOfMembershipRepository.save(
        {
          ...updateTermsOfMembershipDto,
          id,
          scholarshipValueInCents,
          scholar,
        },
        {
          data: user,
        },
      );

      if (isUpdateUser) {
        this.notificationsService.signatureOfTheTerm(scholar.user);
      }
    } catch (err) {
      throw new InternalServerError();
    }
  }

  async getByMonthAndYear(month: number, year: number, scholarId: number) {
    const monthlyReport = await this.monthlyReportRepository.findOne({
      where: {
        month,
        year,
        scholarId,
      },
    });

    return {
      monthlyReport,
    };
  }
}
