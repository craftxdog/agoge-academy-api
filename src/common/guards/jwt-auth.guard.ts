import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { PlatformRole } from 'generated/prisma/enums';
import { getJwtConfig } from '../../config/jwt.config';
import { IS_PUBLIC_KEY } from '../constants';
import { JwtAccessPayload, TenantRequest } from '../interfaces';
import { extractBearerToken } from '../utils';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
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
    this.attachRequestContext(request, payload);

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
  ): void {
    request.user = {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      firstName: payload.firstName,
      lastName: payload.lastName,
      platformRole: payload.platformRole ?? PlatformRole.USER,
    };

    if (payload.organizationId || payload.organizationSlug) {
      request.organization = {
        id: payload.organizationId ?? '',
        slug: payload.organizationSlug ?? '',
      };
    }

    if (payload.memberId && payload.organizationId) {
      request.member = {
        id: payload.memberId,
        organizationId: payload.organizationId,
        userId: payload.sub,
        roles: payload.roles ?? [],
        permissions: payload.permissions ?? [],
        enabledModules: payload.enabledModules ?? [],
      };
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
