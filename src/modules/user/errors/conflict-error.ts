import { ConflictException } from '@nestjs/common';

export class ConflictError extends ConflictException {
  constructor() {
    super('Endereço de email, telefone e/ou CPF já está em uso.');
  }
}
