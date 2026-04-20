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

describe('RbacService', () => {
  const repository = {
    findPermissions: jest.fn(),
    findRolesPage: jest.fn(),
    findRoleById: jest.fn(),
    findRoleByKey: jest.fn(),
    findExistingPermissionKeys: jest.fn(),
    findExistingRoleKeys: jest.fn(),
    createRole: jest.fn(),
    updateRole: jest.fn(),
    replaceRolePermissions: jest.fn(),
    deleteRole: jest.fn(),
    findMemberRoles: jest.fn(),
    replaceMemberRoles: jest.fn(),
    findAccessModules: jest.fn(),
  };

  let service: RbacService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RbacService(repository as never);
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
});
