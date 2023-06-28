import { ForbiddenException } from '@nestjs/common/exceptions';

export class ForbiddenWorkPlanError extends ForbiddenException {
  constructor() {
    super('Você não pode executar esta ação no momento!');
  }
}
