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
});
