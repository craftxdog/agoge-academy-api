import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole } from 'generated/prisma/enums';
import {
  ANY_PERMISSIONS_KEY,
  PERMISSIONS_KEY,
} from '../constants/rbac.constant';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const prisma = {
    $queryRaw: jest.fn(),
  };
  let guard: PermissionsGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$queryRaw.mockResolvedValue([]);
    guard = new PermissionsGuard(
      reflector as unknown as Reflector,
      prisma as never,
    );
  });

  it('allows access when any alternative permission is granted', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PERMISSIONS_KEY) {
        return undefined;
      }

      if (key === ANY_PERMISSIONS_KEY) {
        return ['schedules.write', 'schedules.stable'];
      }

      return false;
    });

    await expect(
      guard.canActivate(
        createContext({
          permissions: ['schedules.stable'],
        }),
      ),
    ).resolves.toBe(true);
  });

  it('rejects access when none of the alternative permissions are granted', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PERMISSIONS_KEY) {
        return undefined;
      }

      if (key === ANY_PERMISSIONS_KEY) {
        return ['schedules.write', 'schedules.stable'];
      }

      return false;
    });

    await expect(
      guard.canActivate(
        createContext({
          permissions: ['schedules.read'],
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('keeps exact permissions as mandatory before checking alternatives', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PERMISSIONS_KEY) {
        return ['schedules.read'];
      }

      if (key === ANY_PERMISSIONS_KEY) {
        return ['schedules.write', 'schedules.stable'];
      }

      return false;
    });

    await expect(
      guard.canActivate(
        createContext({
          permissions: ['schedules.stable'],
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows super admins through alternative permissions', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PERMISSIONS_KEY) {
        return undefined;
      }

      if (key === ANY_PERMISSIONS_KEY) {
        return ['schedules.write', 'schedules.stable'];
      }

      return false;
    });

    await expect(
      guard.canActivate(
        createContext({
          platformRole: PlatformRole.SUPER_ADMIN,
          permissions: [],
        }),
      ),
    ).resolves.toBe(true);
  });

  it('uses endpoint permission rules before decorator permissions', async () => {
    prisma.$queryRaw.mockResolvedValue([
      {
        path_pattern: '/billing/payments/:paymentId/transactions',
        permission_key: 'billing.write',
      },
      {
        path_pattern: '/billing/payments/:paymentId/transactions',
        permission_key: 'billing.transactions.create',
      },
    ]);
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PERMISSIONS_KEY) {
        return ['billing.write'];
      }

      return undefined;
    });

    await expect(
      guard.canActivate(
        createContext({
          method: 'POST',
          path: '/api/v1/billing/payments/payment-id/transactions',
          permissions: ['billing.transactions.create'],
        }),
      ),
    ).resolves.toBe(true);
  });

  it('rejects endpoint permission rules when the member lacks every mapped permission', async () => {
    prisma.$queryRaw.mockResolvedValue([
      {
        path_pattern: '/users/members',
        permission_key: 'users.write',
      },
      {
        path_pattern: '/users/members',
        permission_key: 'member.create',
      },
    ]);

    await expect(
      guard.canActivate(
        createContext({
          method: 'POST',
          path: '/api/v1/users/members',
          permissions: ['users.read'],
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('falls back to decorator permissions while endpoint rules table is missing', async () => {
    prisma.$queryRaw.mockRejectedValue({
      code: 'P2010',
      meta: {
        driverAdapterError: {
          cause: {
            originalCode: '42P01',
            table: 'endpoint_permission_rules',
          },
        },
      },
    });
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PERMISSIONS_KEY) {
        return ['roles.manage'];
      }

      return undefined;
    });

    await expect(
      guard.canActivate(
        createContext({
          method: 'GET',
          path: '/api/v1/rbac/roles',
          permissions: ['roles.manage'],
        }),
      ),
    ).resolves.toBe(true);
  });

  function createContext(params: {
    permissions: string[];
    platformRole?: PlatformRole;
    method?: string;
    path?: string;
  }) {
    const request = {
      method: params.method ?? 'GET',
      originalUrl: params.path ?? '/api/v1/schedules/me/availability',
      url: params.path ?? '/api/v1/schedules/me/availability',
      user: {
        id: 'user-id',
        email: 'user@agoge.com',
        platformRole: params.platformRole ?? PlatformRole.USER,
      },
      member: {
        id: 'member-id',
        organizationId: 'organization-id',
        userId: 'user-id',
        roles: ['receptionist'],
        permissions: params.permissions,
        enabledModules: ['schedules'],
      },
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as never;
  }
});
