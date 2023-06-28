import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';

export class NotFoundUserError extends NotFoundException {
  constructor() {
    super('Usuário não encontrado!');
  }
}
