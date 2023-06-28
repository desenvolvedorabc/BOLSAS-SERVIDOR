import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { getDaysInMonth, differenceInDays } from 'date-fns';
import { CreateSystemParameterDto } from './dto/create-system-parameter.dto';
import { UpdateSystemParameterDto } from './dto/update-system-parameter.dto';
import { User } from '../user/model/entities/user.entity';
import { ForbiddenError, InternalServerError } from 'src/shared/errors';
import { SystemParameter } from './entities/system-parameter.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ForbiddenAnalysisReportError } from './errors/forbidden-error-ananylis-report';

@Injectable()
export class SystemParametersService {
  constructor(
    @InjectRepository(SystemParameter)
    private readonly systemParametersRepository: Repository<SystemParameter>,
  ) {}

  async create(
    createSystemParameterDto: CreateSystemParameterDto,
    user: User,
  ): Promise<void> {
    if (!user.partnerStateId) {
      throw new ForbiddenError();
    }

    const { systemParameter: findSystemParameter } =
      await this.findOneByPartnerState(user.partnerStateId);

    if (findSystemParameter) {
      throw new ConflictException(
        'Já existe um parâmetros do sistema criado pro seu estado.',
      );
    }

    const {
      dayLimitForMonthlyReport,
      daysLimitForAnalysisMonthlyReport,
      daysLimitSendNotificationForMonthlyReport,
    } = createSystemParameterDto;

    const systemParameter = this.systemParametersRepository.create({
      dayLimitForMonthlyReport,
      daysLimitForAnalysisMonthlyReport,
      daysLimitSendNotificationForMonthlyReport,
      partnerStateId: user.partnerStateId,
    });

    try {
      await this.systemParametersRepository.save(systemParameter, {
        data: user,
      });
    } catch (err) {
      throw new InternalServerError();
    }
  }

  async findOneByPartnerState(partnerStateId: number): Promise<{
    systemParameter: SystemParameter;
  }> {
    const systemParameter = await this.systemParametersRepository.findOne({
      where: {
        partnerStateId,
      },
    });

    return {
      systemParameter,
    };
  }

  async me(user: User) {
    const { systemParameter } = await this.findOneByPartnerState(
      user.partnerStateId,
    );

    if (!systemParameter) {
      throw new NotFoundException('Parâmetros do Sistema não encontrado.');
    }

    return {
      systemParameter,
    };
  }

  async findOne(id: number) {
    const systemParameter = await this.systemParametersRepository.findOne({
      where: {
        id,
      },
    });

    if (!systemParameter) {
      throw new NotFoundException('Parâmetros do Sistema não encontrado.');
    }

    return {
      systemParameter,
    };
  }

  async verifyLimitSendMonthlyReport(partnerStateId: number): Promise<void> {
    const { systemParameter } = await this.findOneByPartnerState(
      partnerStateId,
    );

    if (systemParameter) {
      const date = new Date();
      const day = date.getDate();
      const totalDaysInMonth = getDaysInMonth(date);
      const dayLimitForMonthlyReport =
        totalDaysInMonth <= systemParameter.dayLimitForMonthlyReport
          ? totalDaysInMonth
          : systemParameter.dayLimitForMonthlyReport;

      if (day > dayLimitForMonthlyReport) {
        throw new ForbiddenException(
          'Data limite para envio do relatório vencido.',
        );
      }
    }
  }

  async verifyLimitAnalysisMonthlyReport(
    partnerStateId: number,
    dateAnalysis: Date,
  ): Promise<void> {
    const { systemParameter } = await this.findOneByPartnerState(
      partnerStateId,
    );

    if (systemParameter) {
      const daysLimitForAnalysisMonthlyReport =
        systemParameter?.daysLimitForAnalysisMonthlyReport;
      if (daysLimitForAnalysisMonthlyReport) {
        const totalDaysInMonth = getDaysInMonth(dateAnalysis);

        const dayLimitForMonthlyReport =
          totalDaysInMonth <= systemParameter.dayLimitForMonthlyReport
            ? totalDaysInMonth
            : systemParameter.dayLimitForMonthlyReport;

        const monthDateAnalysis = dateAnalysis.getMonth();
        const yearDateAnalysis = dateAnalysis.getFullYear();

        const dateFormatted = new Date(
          yearDateAnalysis,
          monthDateAnalysis,
          dayLimitForMonthlyReport,
        );

        const differenceTotalInDays = differenceInDays(
          new Date(),
          dateFormatted,
        );

        if (differenceTotalInDays > daysLimitForAnalysisMonthlyReport) {
          throw new ForbiddenAnalysisReportError();
        }
      }
    }
  }

  async update(user: User, updateSystemParameterDto: UpdateSystemParameterDto) {
    const { systemParameter } = await this.me(user);

    const editSystemParameter = Object.assign(systemParameter, {
      ...systemParameter,
      ...updateSystemParameterDto,
    });

    try {
      await this.systemParametersRepository.save(editSystemParameter, {
        data: user,
      });
    } catch (err) {
      throw new InternalServerError();
    }
  }
}
