import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole } from 'generated/prisma/enums';
import { PrismaService } from '../../database/prisma.service';
import {
  ANY_PERMISSIONS_KEY,
  IS_PUBLIC_KEY,
  PERMISSIONS_KEY,
} from '../constants/rbac.constant';
import { TenantRequest } from '../interfaces/request-context.interface';
import {
  getCurrentPermissions,
  getCurrentUser,
} from '../utils/request-context.util';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isPublic(context)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = getCurrentUser(request);

    if (user?.platformRole === PlatformRole.SUPER_ADMIN) {
      return true;
    }

    const endpointPermissions =
      await this.findMatchingEndpointPermissions(request);

    if (endpointPermissions.length > 0) {
      return this.canActivateWithAnyPermission(request, endpointPermissions);
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) {
      return this.canActivateAnyPermissionDecorator(context);
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

    return this.canActivateAnyPermissionDecorator(context);
  }

  private canActivateAnyPermissionDecorator(
    context: ExecutionContext,
  ): boolean {
    const anyPermissions = this.reflector.getAllAndOverride<string[]>(
      ANY_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!anyPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<TenantRequest>();
    return this.canActivateWithAnyPermission(request, anyPermissions);
  }

  private canActivateWithAnyPermission(
    request: TenantRequest,
    anyPermissions: string[],
  ): boolean {
    const permissions = new Set(getCurrentPermissions(request));
    const hasAnyPermission = anyPermissions.some((permission) =>
      permissions.has(permission),
    );

    if (!hasAnyPermission) {
      throw new ForbiddenException(
        'Insufficient permissions for this endpoint',
      );
    }

    return true;
  }

  private async findMatchingEndpointPermissions(
    request: TenantRequest,
  ): Promise<string[]> {
    const method = request.method?.toUpperCase();
    const path = this.normalizeRequestPath(request);

    if (!method || !path) {
      return [];
    }

    const rules = await this.findEndpointPermissionRules(method);

    return [
      ...new Set(
        rules
          .filter((rule) => this.pathMatches(rule.path_pattern, path))
          .map((rule) => rule.permission_key),
      ),
    ];
  }

  private async findEndpointPermissionRules(
    method: string,
  ): Promise<Array<{ path_pattern: string; permission_key: string }>> {
    try {
      return await this.prisma.$queryRaw<
        Array<{ path_pattern: string; permission_key: string }>
      >`
        SELECT "path_pattern", "permission_key"
        FROM "endpoint_permission_rules"
        WHERE "method" = ${method}
          AND "is_active" = TRUE
        ORDER BY "path_pattern" ASC, "permission_key" ASC
      `;
    } catch (error) {
      if (this.isMissingEndpointRulesTableError(error)) {
        return [];
      }

      throw error;
    }
  }

  private isMissingEndpointRulesTableError(error: unknown): boolean {
    const prismaError = error as {
      code?: string;
      meta?: {
        driverAdapterError?: {
          cause?: {
            originalCode?: string;
            kind?: string;
            table?: string;
          };
        };
      };
    };
    const cause = prismaError.meta?.driverAdapterError?.cause;

    return (
      prismaError.code === 'P2010' &&
      cause?.originalCode === '42P01' &&
      cause?.table === 'endpoint_permission_rules'
    );
  }

  private normalizeRequestPath(request: TenantRequest): string {
    const rawPath =
      request.originalUrl?.split('?')[0] ?? request.url?.split('?')[0] ?? '';
    const withoutPrefix = rawPath.replace(/^\/api\/v\d+(?=\/|$)/, '');
    const normalized = withoutPrefix.replace(/\/+$/, '');

    return normalized || '/';
  }

  private pathMatches(pattern: string, path: string): boolean {
    const patternSegments = this.getPathSegments(pattern);
    const pathSegments = this.getPathSegments(path);

    if (patternSegments.length !== pathSegments.length) {
      return false;
    }

    return patternSegments.every(
      (segment, index) =>
        segment.startsWith(':') || segment === pathSegments[index],
    );
  }

  private getPathSegments(value: string): string[] {
    return value.replace(/\/+$/, '').split('/').filter(Boolean);
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
