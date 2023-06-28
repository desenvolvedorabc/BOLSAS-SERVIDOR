import { ForbiddenException } from '@nestjs/common';

export class ForbiddenAnalysisReportError extends ForbiddenException {
  constructor() {
    super('Data limite para análise do relatório vencido.');
  }
}
