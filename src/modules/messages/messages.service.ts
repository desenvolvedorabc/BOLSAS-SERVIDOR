import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ForbiddenError, InternalServerError } from 'src/shared/errors';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../user/model/entities/user.entity';
import { PaginationParams } from 'src/helpers/params';
import { paginateData } from 'src/helpers/return-data-paginate';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createMessageDto: CreateMessageDto, user: User) {
    const { title, text, usersIds } = createMessageDto;

    const users = await this.usersRepository
      .createQueryBuilder('Users')
      .where('Users.id IN(:...ids)', { ids: usersIds })
      .getMany();

    let message = this.messagesRepository.create({
      title,
      text,
      createdByUser: user,
      users,
    });

    try {
      message = await this.messagesRepository.save(message, {
        data: user,
      });

      users.map((user) => {
        this.notificationsService.create({
          text,
          title,
          messageId: message.id,
          userId: user.id,
        });
      });
    } catch (err) {
      throw new InternalServerError();
    }
  }

  findAll(
    { page, limit, search, order, column }: PaginationParams,
    user: User,
  ) {
    const optionsColumn = ['createdAt', 'title'];

    const queryBuilder = this.messagesRepository
      .createQueryBuilder('Messages')
      .where('Messages.createdByUser = :userId', { userId: user.id })
      .orderBy('Messages.createdAt', order);

    if (column && optionsColumn.includes(column)) {
      queryBuilder.orderBy(`Messages.${column}`, order);
    }

    if (search) {
      queryBuilder.andWhere('Messages.title LIKE :search', {
        search: `%${search}%`,
      });
    }

    return paginateData(page, limit, queryBuilder);
  }

  async findOne(id: number) {
    const message = await this.messagesRepository.findOne({
      where: {
        id,
      },
      relations: ['users'],
    });

    if (!message) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    return {
      message,
    };
  }

  async remove(id: number, user: User) {
    const { message } = await this.findOne(id);

    if (message.createdByUserId !== user.id) {
      throw new ForbiddenError();
    }

    if (message.deletedAt) {
      throw new ForbiddenException('Mensagem ja foi deletada.');
    }

    try {
      await this.messagesRepository.update(message.id, {
        deletedAt: new Date(),
      });

      this.notificationsService.removeByMessageId(message.id);
    } catch (err) {
      throw new InternalServerError();
    }
  }
}
