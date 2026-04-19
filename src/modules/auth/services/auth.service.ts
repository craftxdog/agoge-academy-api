import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { MemberStatus, UserStatus } from 'generated/prisma/enums';
import { getJwtConfig } from '../../../config';
import { AuthMembershipDto, LoginDto, RegisterOrganizationDto } from '../dto';
import {
  AuthRepository,
  AuthUserRecord,
} from '../repositories/auth.repository';
import {
  AccessTokenPayload,
  AuthMembershipView,
  AuthSession,
  AuthUserView,
  RefreshTokenPayload,
} from '../types';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  private readonly jwtConfig = getJwtConfig();

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async registerOrganization(
    dto: RegisterOrganizationDto,
  ): Promise<AuthSession> {
    const email = this.normalizeEmail(dto.email);
    const username = dto.username?.toLowerCase();
    const slug = this.slugify(dto.organizationSlug ?? dto.organizationName);

    if (await this.authRepository.emailExists(email)) {
      throw new ConflictException('Email is already registered');
    }

    if (username && (await this.authRepository.usernameExists(username))) {
      throw new ConflictException('Username is already registered');
    }

    if (await this.authRepository.organizationSlugExists(slug)) {
      throw new ConflictException('Organization slug is already in use');
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const user = await this.authRepository.createFounderWorkspace({
      dto: { ...dto, email, username },
      slug,
      passwordHash,
    });

    return this.createSession(user, this.selectMembership(user, { slug }));
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const user = await this.authRepository.findUserByEmail(
      this.normalizeEmail(dto.email),
    );

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await this.passwordService.verify(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const activeMembership = this.selectMembership(user, {
      id: dto.organizationId,
      slug: dto.organizationSlug,
    });

    return this.createSession(user, activeMembership);
  }

  async refresh(refreshToken: string | undefined): Promise<AuthSession> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.authRepository.findUserById(payload.sub);

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh session is not valid');
    }

    if (user.refreshTokenHash !== this.hashRefreshToken(refreshToken)) {
      throw new UnauthorizedException('Refresh session is not valid');
    }

    return this.createSession(user, this.selectMembership(user));
  }

  async switchOrganization(
    userId: string,
    organization: { organizationId?: string; organizationSlug?: string },
  ): Promise<AuthSession> {
    if (!organization.organizationId && !organization.organizationSlug) {
      throw new BadRequestException(
        'organizationId or organizationSlug is required',
      );
    }

    const user = await this.authRepository.findUserById(userId);

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid session');
    }

    const activeMembership = this.selectMembership(user, {
      id: organization.organizationId,
      slug: organization.organizationSlug,
      required: true,
    });

    return this.createSession(user, activeMembership);
  }

  async logout(userId: string): Promise<{ loggedOut: true }> {
    await this.authRepository.updateRefreshTokenHash(userId, null);
    return { loggedOut: true };
  }

  async me(
    userId: string,
    organizationId?: string,
  ): Promise<{
    user: AuthUserView;
    activeMembership: AuthMembershipView | null;
    memberships: AuthMembershipView[];
  }> {
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }

    return {
      user: this.mapUser(user),
      activeMembership: this.selectMembership(user, { id: organizationId }),
      memberships: this.mapMemberships(user),
    };
  }

  getRefreshCookieMaxAgeMs(): number {
    return this.expiresInToSeconds(this.jwtConfig.refreshExpiresIn) * 1000;
  }

  private async createSession(
    user: AuthUserRecord,
    activeMembership: AuthMembershipView | null,
  ): Promise<AuthSession> {
    const tokens = await this.createTokens(user, activeMembership);
    await this.authRepository.updateRefreshTokenHash(
      user.id,
      this.hashRefreshToken(tokens.refreshToken),
    );

    return {
      user: this.mapUser(user),
      activeMembership,
      memberships: this.mapMemberships(user),
      tokens,
    };
  }

  private async createTokens(
    user: AuthUserRecord,
    activeMembership: AuthMembershipView | null,
  ): Promise<AuthSession['tokens']> {
    const accessPayload: AccessTokenPayload = {
      tokenType: 'access',
      sub: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      platformRole: user.platformRole,
      organizationId: activeMembership?.organization.id,
      organizationSlug: activeMembership?.organization.slug,
      memberId: activeMembership?.id,
      roles: activeMembership?.roles,
      permissions: activeMembership?.permissions,
      enabledModules: activeMembership?.enabledModules,
    };
    const refreshPayload: RefreshTokenPayload = {
      tokenType: 'refresh',
      sub: user.id,
      email: user.email,
      platformRole: user.platformRole,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.jwtConfig.accessSecret,
        expiresIn: this.jwtConfig.accessExpiresIn as never,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.jwtConfig.refreshSecret,
        expiresIn: this.jwtConfig.refreshExpiresIn as never,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresInSeconds: this.expiresInToSeconds(this.jwtConfig.accessExpiresIn),
    };
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.jwtConfig.refreshSecret,
        },
      );

      if (payload.tokenType !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private selectMembership(
    user: AuthUserRecord,
    criteria?: { id?: string; slug?: string; required?: boolean },
  ): AuthMembershipView | null {
    const memberships = this.mapMemberships(user);

    if (criteria?.id || criteria?.slug) {
      const membership = memberships.find(
        (item) =>
          item.organization.id === criteria.id ||
          item.organization.slug === criteria.slug,
      );

      if (!membership && criteria.required) {
        throw new UnauthorizedException(
          'User does not belong to this organization',
        );
      }

      return membership ?? null;
    }

    return memberships.length === 1 ? memberships[0] : null;
  }

  private mapUser(user: AuthUserRecord): AuthUserView {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      platformRole: user.platformRole,
    };
  }

  private mapMemberships(user: AuthUserRecord): AuthMembershipView[] {
    return user.memberships
      .filter((membership) => membership.status === MemberStatus.ACTIVE)
      .map((membership) => {
        const roles = membership.roles.map((memberRole) => memberRole.role.key);
        const permissions = [
          ...new Set(
            membership.roles.flatMap((memberRole) =>
              memberRole.role.permissions.map(
                (rolePermission) => rolePermission.permission.key,
              ),
            ),
          ),
        ];
        const enabledModules = membership.organization.modules.map(
          (organizationModule) => organizationModule.module.key,
        );

        return {
          id: membership.id,
          organization: {
            id: membership.organization.id,
            slug: membership.organization.slug,
            name: membership.organization.name,
            timezone: membership.organization.timezone,
            locale: membership.organization.locale,
            defaultCurrency: membership.organization.defaultCurrency,
          },
          roles,
          permissions,
          enabledModules,
        } satisfies AuthMembershipDto;
      });
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  private expiresInToSeconds(value: string | number): number {
    if (typeof value === 'number') {
      return value;
    }

    const match = value.match(/^(\d+)([smhd])?$/);

    if (!match) {
      return 900;
    }

    const amount = Number(match[1]);
    const unit = match[2] ?? 's';
    switch (unit) {
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 60 * 60;
      case 'd':
        return amount * 24 * 60 * 60;
      case 's':
      default:
        return amount;
    }
  }
}
