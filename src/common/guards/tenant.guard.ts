import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, SKIP_TENANT_KEY } from '../constants/rbac.constant';
import { TenantRequest } from '../interfaces/request-context.interface';
import {
  getOrganizationId,
  getOrganizationSlug,
} from '../utils/request-context.util';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.shouldSkipTenant(context)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<TenantRequest>();
    const organizationId = getOrganizationId(request);
    const organizationSlug = getOrganizationSlug(request);

    if (!organizationId && !organizationSlug) {
      throw new BadRequestException(
        'Organization context is required for this endpoint',
      );
    }

    return true;
  }

  private shouldSkipTenant(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];

    return (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets) ??
      this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_KEY, targets) ??
      false
    );
  }
}
