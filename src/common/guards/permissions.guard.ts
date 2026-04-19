import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole } from 'generated/prisma/enums';
import { IS_PUBLIC_KEY, PERMISSIONS_KEY } from '../constants/rbac.constant';
import { TenantRequest } from '../interfaces/request-context.interface';
import {
  getCurrentPermissions,
  getCurrentUser,
} from '../utils/request-context.util';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.isPublic(context)) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = getCurrentUser(request);

    if (user?.platformRole === PlatformRole.SUPER_ADMIN) {
      return true;
    }

    const permissions = new Set(getCurrentPermissions(request));
    const hasRequiredPermissions = requiredPermissions.every((permission) =>
      permissions.has(permission),
    );

    if (!hasRequiredPermissions) {
      throw new ForbiddenException(
        'Insufficient permissions for this endpoint',
      );
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
