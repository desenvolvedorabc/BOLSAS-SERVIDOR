import { NotFoundException } from '@nestjs/common';

export class NotFoundWorkPlanError extends NotFoundException {
  constructor() {
    super('Plano de trabalho não encontrado.');
  }
}
