import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { User } from 'src/modules/user/model/entities/user.entity';
import { SubCredentialRole } from 'src/modules/user/model/enum/sub-role.enum';

type RequestType = {
  user: User;
};

@Injectable()
export class AreasGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<RequestType>();
    const user = request.user;

    const requiredAreas = this.reflector.get<string[]>(
      'areas',
      context.getHandler(),
    );

    if (user.subRole !== SubCredentialRole.ADMIN && requiredAreas?.length > 0) {
      const areasUser = request.user?.access_profile?.areas;

      const hasAllRoles = areasUser?.some((area) =>
        requiredAreas.includes(area.tag),
      );

      if (!hasAllRoles) {
        return false;
      }
    }

    return true;
  }
}
