import { SettingsController } from './settings.controller';

describe('SettingsController', () => {
  const settingsService = {
    getOrganizationProfile: jest.fn(),
    updateOrganizationProfile: jest.fn(),
    updateBranding: jest.fn(),
    uploadBrandingAsset: jest.fn(),
    listSettings: jest.fn(),
    upsertSettings: jest.fn(),
    listModules: jest.fn(),
    updateModule: jest.fn(),
    listScreens: jest.fn(),
    createScreen: jest.fn(),
    updateScreen: jest.fn(),
    deleteScreen: jest.fn(),
  };
  let controller: SettingsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new SettingsController(settingsService as never);
  });

  it('delegates organization profile requests', async () => {
    const dto = { name: 'Agoge Academy' };
    const response = { id: 'organization-id' };
    settingsService.getOrganizationProfile.mockResolvedValue(response);
    settingsService.updateOrganizationProfile.mockResolvedValue(response);

    await expect(controller.getOrganization('organization-id')).resolves.toBe(
      response,
    );
    await expect(
      controller.updateOrganization('organization-id', dto as never),
    ).resolves.toBe(response);
  });

  it('delegates branding update and upload requests', async () => {
    const brandingDto = { logoUrl: 'https://cdn.agoge.com/logo.png' };
    const file = {
      originalname: 'logo.png',
      mimetype: 'image/png',
      size: 100,
      buffer: Buffer.from('file'),
    };
    const response = { id: 'branding-id' };
    settingsService.updateBranding.mockResolvedValue(response);
    settingsService.uploadBrandingAsset.mockResolvedValue(response);

    await expect(
      controller.updateBranding('organization-id', brandingDto as never),
    ).resolves.toBe(response);
    await expect(
      controller.uploadBrandingLogo('organization-id', file),
    ).resolves.toBe(response);
    await expect(
      controller.uploadBrandingIcon('organization-id', file),
    ).resolves.toBe(response);
    expect(settingsService.uploadBrandingAsset).toHaveBeenNthCalledWith(
      1,
      'organization-id',
      'logo',
      file,
    );
    expect(settingsService.uploadBrandingAsset).toHaveBeenNthCalledWith(
      2,
      'organization-id',
      'icon',
      file,
    );
  });

  it('delegates preference and module requests', async () => {
    const query = { namespace: 'billing' };
    const dto = { settings: [{ namespace: 'billing', key: 'currency', value: 'USD' }] };
    const response = [{ id: 'setting-id' }];
    settingsService.listSettings.mockResolvedValue(response);
    settingsService.upsertSettings.mockResolvedValue(response);
    settingsService.listModules.mockResolvedValue(response);
    settingsService.updateModule.mockResolvedValue({ id: 'module-id' });

    await expect(
      controller.listPreferences('organization-id', query as never),
    ).resolves.toBe(response);
    await expect(
      controller.upsertPreferences('organization-id', dto as never),
    ).resolves.toBe(response);
    await expect(controller.listModules('organization-id')).resolves.toBe(
      response,
    );
    await expect(
      controller.updateModule(
        'organization-id',
        'billing',
        { isEnabled: true } as never,
      ),
    ).resolves.toEqual({ id: 'module-id' });
  });

  it('delegates screen requests', async () => {
    const response = { id: 'screen-id' };
    settingsService.listScreens.mockResolvedValue([response]);
    settingsService.createScreen.mockResolvedValue(response);
    settingsService.updateScreen.mockResolvedValue(response);
    settingsService.deleteScreen.mockResolvedValue(response);

    await expect(controller.listScreens('organization-id')).resolves.toEqual([
      response,
    ]);
    await expect(
      controller.createScreen(
        'organization-id',
        { key: 'custom.reports', title: 'Reports', type: 'CUSTOM_PAGE' } as never,
      ),
    ).resolves.toBe(response);
    await expect(
      controller.updateScreen(
        'organization-id',
        'screen-id',
        { title: 'Updated' } as never,
      ),
    ).resolves.toBe(response);
    await expect(
      controller.deleteScreen('organization-id', 'screen-id'),
    ).resolves.toBe(response);
  });
});
