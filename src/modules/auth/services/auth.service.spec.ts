import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MemberStatus, PlatformRole, UserStatus } from 'generated/prisma/enums';
import { AuthService } from './auth.service';

const createUserRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-id',
  email: 'founder@agoge.com',
  username: 'founder',
  passwordHash: 'hash',
  firstName: 'Alex',
  lastName: 'Founder',
  platformRole: PlatformRole.USER,
  status: UserStatus.ACTIVE,
  refreshTokenHash: null,
  memberships: [
    {
      id: 'member-id',
      organizationId: 'organization-id',
      userId: 'user-id',
      status: MemberStatus.ACTIVE,
      phone: null,
      documentId: null,
      address: null,
      joinedAt: new Date('2026-04-20T00:00:00.000Z'),
      deletedAt: null,
      createdAt: new Date('2026-04-20T00:00:00.000Z'),
      updatedAt: new Date('2026-04-20T00:00:00.000Z'),
      organization: {
        id: 'organization-id',
        slug: 'agoge-academy',
        name: 'Agoge Academy',
        timezone: 'America/Managua',
        locale: 'es-NI',
        defaultCurrency: 'USD',
        modules: [
          {
            module: { key: 'settings' },
          },
          {
            module: { key: 'analytics' },
          },
        ],
      },
      roles: [
        {
          role: {
            key: 'admin',
            permissions: [
              { permission: { key: 'settings.read' } },
              { permission: { key: 'analytics.read' } },
            ],
          },
        },
      ],
    },
  ],
  ...overrides,
});

describe('AuthService', () => {
  const authRepository = {
    emailExists: jest.fn(),
    usernameExists: jest.fn(),
    organizationSlugExists: jest.fn(),
    createFounderWorkspace: jest.fn(),
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    updateRefreshTokenHash: jest.fn(),
  };
  const passwordService = {
    hash: jest.fn(),
    verify: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  } as unknown as JwtService;
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      authRepository as never,
      passwordService as never,
      jwtService,
    );
  });

  it('rejects registration when the generated slug is invalid', async () => {
    await expect(
      service.registerOrganization({
        organizationName: '!!!',
        email: 'founder@agoge.com',
        firstName: 'Alex',
        lastName: 'Founder',
        password: 'Password123!',
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(passwordService.hash).not.toHaveBeenCalled();
    expect(authRepository.createFounderWorkspace).not.toHaveBeenCalled();
  });

  it('rejects login when the password does not match', async () => {
    authRepository.findUserByEmail.mockResolvedValue(createUserRecord());
    passwordService.verify.mockResolvedValue(false);

    await expect(
      service.login({
        email: 'founder@agoge.com',
        password: 'wrong-password',
      } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('requires a refresh token to rotate the session', async () => {
    await expect(service.refresh(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects switching organization without selector fields', async () => {
    await expect(
      service.switchOrganization('user-id', {}),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('builds me() response with the active membership when requested', async () => {
    authRepository.findUserById.mockResolvedValue(createUserRecord());

    const result = await service.me('user-id', 'organization-id');

    expect(result.user.email).toBe('founder@agoge.com');
    expect(result.activeMembership?.organization.slug).toBe('agoge-academy');
    expect(result.memberships[0].permissions).toEqual([
      'settings.read',
      'analytics.read',
    ]);
  });

  it('converts refresh cookie max age from JWT config to milliseconds', () => {
    expect(service.getRefreshCookieMaxAgeMs()).toBeGreaterThan(0);
  });
});
