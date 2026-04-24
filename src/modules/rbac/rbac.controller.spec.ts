import { RbacController } from './rbac.controller';

describe('RbacController', () => {
  const rbacService = {
    listPermissions: jest.fn(),
    createPermission: jest.fn(),
    listRoles: jest.fn(),
    createRole: jest.fn(),
    getRole: jest.fn(),
    updateRole: jest.fn(),
    replaceRolePermissions: jest.fn(),
    deleteRole: jest.fn(),
    getMemberRoles: jest.fn(),
    replaceMemberRoles: jest.fn(),
    getAccessMatrix: jest.fn(),
  };
  let controller: RbacController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new RbacController(rbacService as never);
  });

  it('delegates permission and access matrix reads', async () => {
    const permissionQuery = { search: 'billing' };
    const permissions = [{ key: 'billing.read' }];
    const matrix = { modules: [] };
    rbacService.listPermissions.mockResolvedValue(permissions);
    rbacService.getAccessMatrix.mockResolvedValue(matrix);

    await expect(
      controller.listPermissions(permissionQuery as never),
    ).resolves.toBe(permissions);
    await expect(controller.getAccessMatrix('organization-id')).resolves.toBe(
      matrix,
    );
    expect(rbacService.listPermissions).toHaveBeenCalledWith(permissionQuery);
    expect(rbacService.getAccessMatrix).toHaveBeenCalledWith('organization-id');
  });

  it('delegates permission creation requests', async () => {
    const dto = { key: 'schedules.write', name: 'Write schedules' };
    const response = { id: 'permission-id' };
    rbacService.createPermission.mockResolvedValue(response);

    await expect(
      controller.createPermission('organization-id', dto as never),
    ).resolves.toBe(response);

    expect(rbacService.createPermission).toHaveBeenCalledWith(
      'organization-id',
      dto,
    );
  });

  it('delegates role CRUD requests', async () => {
    const query = { search: 'admin' };
    const dto = { key: 'coach', name: 'Coach' };
    const response = { id: 'role-id' };
    rbacService.listRoles.mockResolvedValue(response);
    rbacService.createRole.mockResolvedValue(response);
    rbacService.getRole.mockResolvedValue(response);
    rbacService.updateRole.mockResolvedValue(response);
    rbacService.replaceRolePermissions.mockResolvedValue(response);
    rbacService.deleteRole.mockResolvedValue(response);

    await expect(
      controller.listRoles('organization-id', query as never),
    ).resolves.toBe(response);
    await expect(
      controller.createRole('organization-id', dto as never),
    ).resolves.toBe(response);
    await expect(
      controller.getRole('organization-id', 'role-id'),
    ).resolves.toBe(response);
    await expect(
      controller.updateRole('organization-id', 'role-id', dto as never),
    ).resolves.toBe(response);
    await expect(
      controller.replaceRolePermissions('organization-id', 'role-id', {
        permissionKeys: ['billing.read'],
      } as never),
    ).resolves.toBe(response);
    await expect(
      controller.deleteRole('organization-id', 'role-id'),
    ).resolves.toBe(response);
  });

  it('delegates member role requests', async () => {
    const response = { memberId: 'member-id', roles: [] };
    rbacService.getMemberRoles.mockResolvedValue(response);
    rbacService.replaceMemberRoles.mockResolvedValue(response);

    await expect(
      controller.getMemberRoles('organization-id', 'member-id'),
    ).resolves.toBe(response);
    await expect(
      controller.replaceMemberRoles('organization-id', 'member-id', {
        roleKeys: ['admin'],
      } as never),
    ).resolves.toBe(response);
    expect(rbacService.getMemberRoles).toHaveBeenCalledWith(
      'organization-id',
      'member-id',
    );
    expect(rbacService.replaceMemberRoles).toHaveBeenCalledWith(
      'organization-id',
      'member-id',
      { roleKeys: ['admin'] },
    );
  });
});
