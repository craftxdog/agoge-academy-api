import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole } from 'generated/prisma/enums';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../constants/rbac.constant';
import { TenantRequest } from '../interfaces/request-context.interface';
import { getCurrentRoles, getCurrentUser } from '../utils/request-context.util';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.isPublic(context)) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = getCurrentUser(request);

    if (user?.platformRole === PlatformRole.SUPER_ADMIN) {
      return true;
    }

    const roles = new Set(getCurrentRoles(request));
    const hasRequiredRole = requiredRoles.some((role) => roles.has(role));

    if (!hasRequiredRole) {
      throw new ForbiddenException('Insufficient role for this endpoint');
    }

    return true;
  }

  private isPublic(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false
    );
  }
}
