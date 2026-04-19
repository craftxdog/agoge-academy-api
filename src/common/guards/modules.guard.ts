import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole } from 'generated/prisma/enums';
import { IS_PUBLIC_KEY, MODULES_KEY } from '../constants/rbac.constant';
import { TenantRequest } from '../interfaces/request-context.interface';
import {
  getCurrentEnabledModules,
  getCurrentUser,
} from '../utils/request-context.util';

@Injectable()
export class ModulesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.isPublic(context)) {
      return true;
    }

    const requiredModules = this.reflector.getAllAndOverride<string[]>(
      MODULES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredModules?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = getCurrentUser(request);

    if (user?.platformRole === PlatformRole.SUPER_ADMIN) {
      return true;
    }

    const enabledModules = new Set(getCurrentEnabledModules(request));
    const hasRequiredModules = requiredModules.every((module) =>
      enabledModules.has(module),
    );

    if (!hasRequiredModules) {
      throw new ForbiddenException('Required module is not enabled');
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
