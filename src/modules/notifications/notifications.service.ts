import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Equal, Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationParams } from 'src/helpers/params';
import { paginateData } from 'src/helpers/return-data-paginate';
import { User } from '../user/model/entities/user.entity';
import { InternalServerError } from 'src/shared/errors';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  create(createNotificationDto: CreateNotificationDto) {
    const { title, text, messageId, userId } = createNotificationDto;

    const notification = this.notificationRepository.create({
      title,
      text,
      messageId,
      userId,
    });

    this.notificationRepository.save(notification);
  }

  preRegistration(user: User) {
    const message = `Olá ${user.name}, seu cadastro completo está disponível para preenchimento.`;
    this.create({
      title: 'Cadastro Completo Do Bolsista.',
      text: message,
      userId: user.id,
      messageId: null,
    });
  }

  signatureOfTheTerm(user: User) {
    const message = `Olá ${user.name}, seu termo de compromisso está disponível para assinatura.`;
    this.create({
      title: 'Assinatura do termo de compromisso.',
      text: message,
      userId: user.id,
      messageId: null,
    });
  }

  createWorkPlan(user: User) {
    const message = `Olá ${user.name}, você deve criar seu plano de trabalho.`;
    this.create({
      title: 'Criação Do Plano De Trabalho.',
      text: message,
      userId: user.id,
      messageId: null,
    });
  }

  reproveMonthlyReport(user: User) {
    const message = `Olá ${user.name}, seu relatório mensal foi reprovado. Verifique as pendências e ajuste o quanto antes!`;
    this.create({
      title: 'Relatório Mensal Reprovado.',
      text: message,
      userId: user.id,
      messageId: null,
    });
  }

  async findAll({ page, limit }: PaginationParams, user: User) {
    const totalNotificationsNotRead = await this.notificationRepository
      .createQueryBuilder('Notification')
      .where('Notification.user = :userId', { userId: user.id })
      .andWhere('Notification.readAt is NULL')
      .getCount();

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('Notification')
      .where('Notification.user = :userId', { userId: user.id })
      .orderBy('Notification.createdAt', 'DESC');

    const data = await paginateData(page, limit, queryBuilder);

    return {
      ...data,
      totalNotificationsNotRead,
    };
  }

  async findOne(id: number) {
    const notification = await this.notificationRepository.findOne({
      where: {
        id,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notificação não encontrada.');
    }

    return {
      notification,
    };
  }

  async read(id: number): Promise<void> {
    const { notification } = await this.findOne(id);

    if (notification.readAt) {
      return;
    }

    try {
      await this.notificationRepository.update(notification.id, {
        readAt: new Date(),
      });
    } catch (err) {
      throw new InternalServerError();
    }
  }

  removeByMessageId(id: number) {
    this.notificationRepository.delete({
      messageId: Equal(id),
    });
  }
}
