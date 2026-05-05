import { ForbiddenException } from '@nestjs/common';
import { RbacService } from './rbac.service';

const createRoleRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'role-id',
  organizationId: 'organization-id',
  key: 'front-desk',
  name: 'Front Desk',
  description: null,
  isSystem: false,
  isDefault: false,
  createdAt: new Date('2026-04-20T00:00:00.000Z'),
  updatedAt: new Date('2026-04-20T00:00:00.000Z'),
  permissions: [],
  members: [],
  _count: { members: 0 },
  ...overrides,
});

const createMemberRoleRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'member-id',
  organizationId: 'organization-id',
  userId: 'user-id',
  status: 'ACTIVE',
  roles: [],
  ...overrides,
});

describe('RbacService', () => {
  const repository = {
    findPermissions: jest.fn(),
    findPermissionByKey: jest.fn(),
    findModuleByKey: jest.fn(),
    findRolesPage: jest.fn(),
    findRoleById: jest.fn(),
    findRoleByKey: jest.fn(),
    findExistingPermissionKeys: jest.fn(),
    findExistingRoleKeys: jest.fn(),
    createPermission: jest.fn(),
    createRole: jest.fn(),
    updateRole: jest.fn(),
    replaceRolePermissions: jest.fn(),
    deleteRole: jest.fn(),
    findMemberRoles: jest.fn(),
    replaceMemberRoles: jest.fn(),
    findAccessModules: jest.fn(),
  };
  const realtimeService = {
    publishOrganizationEvent: jest.fn(),
  };

  let service: RbacService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RbacService(repository as never, realtimeService as never);
  });

  it('normalizes role and permission keys when creating a role', async () => {
    const role = createRoleRecord();
    repository.findRoleByKey.mockResolvedValue(null);
    repository.findExistingPermissionKeys.mockResolvedValue([
      'users.read',
      'settings.read',
    ]);
    repository.createRole.mockResolvedValue(role);

    await expect(
      service.createRole('organization-id', {
        key: 'Front-Desk',
        name: 'Front Desk',
        permissionKeys: ['USERS.READ', 'settings.read', 'users.read'],
      }),
    ).resolves.toEqual(expect.objectContaining({ key: 'front-desk' }));

    expect(repository.createRole).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'front-desk',
        permissionKeys: ['users.read', 'settings.read'],
      }),
    );
  });

  it('creates permissions with normalized keys and module linkage', async () => {
    repository.findPermissionByKey.mockResolvedValue(null);
    repository.findModuleByKey.mockResolvedValue({
      id: 'module-id',
      key: 'schedules',
      name: 'Schedules',
      description: null,
    });
    repository.createPermission.mockResolvedValue({
      id: 'permission-id',
      key: 'schedules.write',
      name: 'Write schedules',
      description: null,
      module: {
        id: 'module-id',
        key: 'schedules',
        name: 'Schedules',
        description: null,
        status: 'ACTIVE',
        sortOrder: 0,
        createdAt: new Date('2026-04-20T00:00:00.000Z'),
        updatedAt: new Date('2026-04-20T00:00:00.000Z'),
      },
      createdAt: new Date('2026-04-20T00:00:00.000Z'),
      updatedAt: new Date('2026-04-20T00:00:00.000Z'),
    });

    await expect(
      service.createPermission('organization-id', {
        key: 'SCHEDULES.WRITE',
        name: 'Write schedules',
        moduleKey: 'SCHEDULES',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        key: 'schedules.write',
        module: expect.objectContaining({ key: 'schedules' }),
      }),
    );

    expect(repository.createPermission).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'schedules.write',
        moduleId: 'module-id',
      }),
    );
  });

  it('protects system roles from permission replacement', async () => {
    repository.findRoleById.mockResolvedValue(
      createRoleRecord({ key: 'admin', isSystem: true }),
    );

    await expect(
      service.replaceRolePermissions('organization-id', 'role-id', {
        permissionKeys: ['users.read'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(repository.replaceRolePermissions).not.toHaveBeenCalled();
  });

  it('emits realtime after replacing member roles', async () => {
    repository.findMemberRoles.mockResolvedValue(createMemberRoleRecord());
    repository.findExistingRoleKeys.mockResolvedValue(['coach']);
    repository.replaceMemberRoles.mockResolvedValue(
      createMemberRoleRecord({
        roles: [
          {
            role: createRoleRecord({
              key: 'coach',
              name: 'Coach',
            }),
          },
        ],
      }),
    );

    await service.replaceMemberRoles('organization-id', 'member-id', {
      roleKeys: ['coach'],
    });

    expect(realtimeService.publishOrganizationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'organization-id',
        domain: 'rbac',
        resource: 'member-role',
        action: 'roles.replaced',
      }),
    );
  });

  it('filters navigation to enabled modules and granted screens only', async () => {
    repository.findAccessModules.mockResolvedValue([
      {
        moduleId: 'module-billing',
        isEnabled: true,
        module: {
          key: 'billing',
          name: 'Billing',
          permissions: [
            {
              id: 'perm-1',
              key: 'billing.read',
              name: 'Read billing',
              description: null,
              module: {
                key: 'billing',
                name: 'Billing',
                description: null,
              },
            },
            {
              id: 'perm-2',
              key: 'billing.self.read',
              name: 'Read own billing',
              description: null,
              module: {
                key: 'billing',
                name: 'Billing',
                description: null,
              },
            },
          ],
        },
        organization: {
          screens: [
            {
              moduleId: 'module-billing',
              key: 'billing.payments',
              title: 'Payments',
              path: '/billing/payments',
              type: 'SYSTEM',
              requiredPermissionKey: 'billing.read',
              isVisible: true,
            },
            {
              moduleId: 'module-billing',
              key: 'billing.my-payments',
              title: 'My Payments',
              path: '/billing/me/payments',
              type: 'SYSTEM',
              requiredPermissionKey: 'billing.self.read',
              isVisible: true,
            },
          ],
        },
      },
    ]);

    const result = await service.getNavigation({
      organizationId: 'organization-id',
      permissions: ['billing.self.read'],
      enabledModules: ['billing'],
    });

    expect(result.modules).toHaveLength(1);
    expect(result.modules[0].permissions.map((item) => item.key)).toEqual([
      'billing.self.read',
    ]);
    expect(result.modules[0].screens.map((item) => item.key)).toEqual([
      'billing.my-payments',
    ]);
    expect(result.modules[0].screens[0].accessScope).toBe('self');
  });
});
