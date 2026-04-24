import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PlatformRole } from 'generated/prisma/enums';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const jwtService = {
    verifyAsync: jest.fn(),
  };
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const prisma = {
    organizationMember: {
      findFirst: jest.fn(),
    },
  };

  let guard: JwtAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    reflector.getAllAndOverride.mockReturnValue(false);
    guard = new JwtAuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
      prisma as never,
    );
  });

  it('hydrates the active member permissions from the database on each request', async () => {
    jwtService.verifyAsync = jest.fn().mockResolvedValue({
      tokenType: 'access',
      sub: 'user-id',
      email: 'reception@agoge.com',
      platformRole: PlatformRole.USER,
      organizationId: 'organization-id',
      organizationSlug: 'agoge-academy',
      memberId: 'member-id',
      roles: ['customer'],
      permissions: ['schedules.read'],
      enabledModules: ['users'],
    });
    prisma.organizationMember.findFirst.mockResolvedValue({
      id: 'member-id',
      organizationId: 'organization-id',
      userId: 'user-id',
      organization: {
        id: 'organization-id',
        slug: 'agoge-academy',
        name: 'Agoge Academy',
        timezone: 'America/Managua',
        locale: 'es-NI',
        defaultCurrency: 'USD',
        modules: [
          {
            module: {
              key: 'users',
            },
          },
          {
            module: {
              key: 'schedules',
            },
          },
        ],
      },
      roles: [
        {
          role: {
            key: 'receptionist',
            permissions: [
              { permission: { key: 'schedules.read' } },
              { permission: { key: 'schedules.write' } },
            ],
          },
        },
      ],
    });

    const request = {
      headers: {
        authorization: 'Bearer access-token',
      },
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    };

    await expect(guard.canActivate(context as never)).resolves.toBe(true);
    expect(request.member).toEqual({
      id: 'member-id',
      organizationId: 'organization-id',
      userId: 'user-id',
      roles: ['receptionist'],
      permissions: ['schedules.read', 'schedules.write'],
      enabledModules: ['users', 'schedules'],
    });
  });
});
