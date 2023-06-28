import { UnauthorizedException } from '@nestjs/common';

export class UnauthorizedCredentialsError extends UnauthorizedException {
  constructor() {
    super('Por favor cheque suas credenciais de login!');
  }
}
