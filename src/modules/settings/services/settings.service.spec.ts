import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationStatus, ScreenType } from 'generated/prisma/enums';
import { SettingsService } from './settings.service';

const organization = {
  id: 'organization-id',
  slug: 'agoge-academy',
  name: 'Agoge Academy',
  legalName: null,
  taxId: null,
  status: OrganizationStatus.ACTIVE,
  timezone: 'America/Managua',
  locale: 'es-NI',
  defaultCurrency: 'NIO',
  deletedAt: null,
  createdAt: new Date('2026-04-20T00:00:00.000Z'),
  updatedAt: new Date('2026-04-20T00:00:00.000Z'),
  branding: null,
};

const createScreen = (overrides: Record<string, unknown> = {}) => ({
  id: 'screen-id',
  organizationId: 'organization-id',
  appScreenId: 'app-screen-id',
  moduleId: 'module-id',
  key: 'settings.roles',
  title: 'Roles and Permissions',
  path: '/settings/roles',
  type: ScreenType.SYSTEM,
  requiredPermissionKey: 'roles.manage',
  config: null,
  sortOrder: 10,
  isVisible: true,
  createdAt: new Date('2026-04-20T00:00:00.000Z'),
  updatedAt: new Date('2026-04-20T00:00:00.000Z'),
  module: {
    id: 'module-id',
    key: 'settings',
    name: 'Settings',
    description: null,
    status: 'ACTIVE',
    sortOrder: 10,
    createdAt: new Date('2026-04-20T00:00:00.000Z'),
    updatedAt: new Date('2026-04-20T00:00:00.000Z'),
  },
  appScreen: null,
  ...overrides,
});

describe('SettingsService', () => {
  const repository = {
    findOrganization: jest.fn(),
    updateOrganization: jest.fn(),
    upsertBranding: jest.fn(),
    findSettings: jest.fn(),
    upsertSettings: jest.fn(),
    findModules: jest.fn(),
    appModuleExists: jest.fn(),
    permissionExists: jest.fn(),
    updateModule: jest.fn(),
    findScreens: jest.fn(),
    createScreen: jest.fn(),
    findScreenById: jest.fn(),
    updateScreen: jest.fn(),
    deleteScreen: jest.fn(),
  };
  let service: SettingsService;

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findOrganization.mockResolvedValue(organization);
    service = new SettingsService(repository as never);
  });

  it('throws when organization is missing', async () => {
    repository.findOrganization.mockResolvedValue(null);

    await expect(
      service.getOrganizationProfile('organization-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('prevents disabling the settings module', async () => {
    await expect(
      service.updateModule('organization-id', 'settings', {
        isEnabled: false,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(repository.updateModule).not.toHaveBeenCalled();
  });

  it('rejects duplicate settings in the same bulk request', async () => {
    await expect(
      service.upsertSettings('organization-id', {
        settings: [
          { namespace: 'Billing', key: 'Currency', value: 'NIO' },
          { namespace: 'billing', key: 'currency', value: 'USD' },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.upsertSettings).not.toHaveBeenCalled();
  });

  it('rejects manually created system screens', async () => {
    await expect(
      service.createScreen('organization-id', {
        key: 'settings.custom',
        title: 'Custom',
        type: ScreenType.SYSTEM,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.createScreen).not.toHaveBeenCalled();
  });

  it('prevents deleting system screens', async () => {
    repository.findScreenById.mockResolvedValue(createScreen());

    await expect(
      service.deleteScreen('organization-id', 'screen-id'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(repository.deleteScreen).not.toHaveBeenCalled();
  });
});
