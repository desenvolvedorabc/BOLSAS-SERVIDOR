import { ConflictException } from '@nestjs/common';

export class ConflictError extends ConflictException {
  constructor() {
    super('Já existe uma regional parceira com esse nome.');
  }
}
