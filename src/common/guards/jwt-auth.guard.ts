import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { PlatformRole } from 'generated/prisma/enums';
import { PrismaService } from '../../database/prisma.service';
import { getJwtConfig } from '../../config/jwt.config';
import { IS_PUBLIC_KEY } from '../constants';
import { JwtAccessPayload, TenantRequest } from '../interfaces';
import {
  extractBearerToken,
  LiveAccessContext,
  resolveLiveAccessContext,
} from '../utils';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isPublic(context)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<TenantRequest>();
    const token = extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Bearer token is required');
    }

    const payload = await this.verifyToken(token);
    const liveAccessContext = await resolveLiveAccessContext(
      this.prisma,
      payload,
    );

    if (
      payload.memberId &&
      payload.organizationId &&
      !liveAccessContext.member
    ) {
      throw new UnauthorizedException(
        'Organization membership is no longer active',
      );
    }

    this.attachRequestContext(request, payload, liveAccessContext);

    return true;
  }

  protected async verifyToken(token: string): Promise<JwtAccessPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtAccessPayload>(
        token,
        {
          secret: getJwtConfig().accessSecret,
        },
      );

      if (payload.tokenType && payload.tokenType !== 'access') {
        throw new Error('Invalid token type');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  protected attachRequestContext(
    request: TenantRequest,
    payload: JwtAccessPayload,
    liveAccessContext: LiveAccessContext,
  ): void {
    request.user = {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      firstName: payload.firstName,
      lastName: payload.lastName,
      platformRole: payload.platformRole ?? PlatformRole.USER,
    };

    const organization =
      liveAccessContext.organization ??
      (payload.organizationId || payload.organizationSlug
        ? {
            id: payload.organizationId ?? '',
            slug: payload.organizationSlug ?? '',
          }
        : undefined);

    if (organization) {
      request.organization = organization;
    }

    const member =
      liveAccessContext.member ??
      (payload.memberId && payload.organizationId
        ? {
            id: payload.memberId,
            organizationId: payload.organizationId,
            userId: payload.sub,
            roles: payload.roles ?? [],
            permissions: payload.permissions ?? [],
            enabledModules: payload.enabledModules ?? [],
          }
        : undefined);

    if (member) {
      request.member = member;
    }
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
