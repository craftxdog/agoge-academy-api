import { RbacNavigationController } from './rbac-navigation.controller';

describe('RbacNavigationController', () => {
  const rbacService = {
    getNavigation: jest.fn(),
  };
  let controller: RbacNavigationController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new RbacNavigationController(rbacService as never);
  });

  it('delegates current member navigation requests', async () => {
    const response = { organizationId: 'organization-id', modules: [] };
    rbacService.getNavigation.mockResolvedValue(response);

    await expect(
      controller.getNavigation(
        'organization-id',
        ['billing.self.read'],
        ['billing'],
      ),
    ).resolves.toBe(response);

    expect(rbacService.getNavigation).toHaveBeenCalledWith({
      organizationId: 'organization-id',
      permissions: ['billing.self.read'],
      enabledModules: ['billing'],
    });
  });
});
