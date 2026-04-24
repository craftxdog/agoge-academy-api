import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ScreenType } from 'generated/prisma/enums';
import { SYSTEM_MODULES } from '../../../common';
import { RealtimeService } from '../../realtime';
import { StorageFile, StorageService } from '../../storage';
import {
  CreateOrganizationScreenDto,
  OrganizationBrandingResponseDto,
  OrganizationModuleResponseDto,
  OrganizationProfileResponseDto,
  OrganizationScreenResponseDto,
  OrganizationSettingInputDto,
  OrganizationSettingResponseDto,
  OrganizationSettingsQueryDto,
  UpdateOrganizationBrandingDto,
  UpdateOrganizationModuleDto,
  UpdateOrganizationProfileDto,
  UpdateOrganizationScreenDto,
  UpsertOrganizationSettingsDto,
} from '../dto';
import {
  SettingsBrandingRecord,
  SettingsModuleRecord,
  SettingsOrganizationRecord,
  SettingsRepository,
  SettingsScreenRecord,
  SettingsValueRecord,
} from '../repositories/settings.repository';

type BrandingAssetField = 'logo' | 'icon';

@Injectable()
export class SettingsService {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly storageService: StorageService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async getOrganizationProfile(
    organizationId: string,
  ): Promise<OrganizationProfileResponseDto> {
    const organization = await this.getOrganizationOrThrow(organizationId);

    return this.mapOrganization(organization);
  }

  async updateOrganizationProfile(
    organizationId: string,
    dto: UpdateOrganizationProfileDto,
  ): Promise<OrganizationProfileResponseDto> {
    await this.getOrganizationOrThrow(organizationId);
    const organization = await this.settingsRepository.updateOrganization(
      organizationId,
      {
        ...dto,
        name: dto.name?.trim(),
        legalName: dto.legalName?.trim(),
        taxId: dto.taxId?.trim(),
        timezone: dto.timezone?.trim(),
        locale: dto.locale?.trim(),
        defaultCurrency: dto.defaultCurrency?.trim().toUpperCase(),
      },
    );

    const response = this.mapOrganization(organization);

    this.emitSettingsEvent({
      organizationId,
      resource: 'organization',
      action: 'updated',
      entityId: response.id,
      data: response,
      invalidate: ['settings.organization', 'analytics.dashboard'],
    });

    return response;
  }

  async updateBranding(
    organizationId: string,
    dto: UpdateOrganizationBrandingDto,
  ): Promise<OrganizationBrandingResponseDto> {
    const organization = await this.getOrganizationOrThrow(organizationId);
    const normalizedBranding = this.normalizeBrandingPayload(dto);
    const keysToDelete = this.resolveBrandingKeysToDelete(
      organization.branding,
      normalizedBranding,
    );
    const branding = await this.settingsRepository.upsertBranding(
      organizationId,
      normalizedBranding,
    );

    await this.deleteBrandingAssets(keysToDelete);

    const response = this.mapBranding(branding);

    this.emitSettingsEvent({
      organizationId,
      resource: 'branding',
      action: 'updated',
      entityId: branding.id,
      data: response,
      invalidate: ['settings.organization', 'analytics.dashboard'],
    });

    return response;
  }

  async uploadBrandingAsset(
    organizationId: string,
    field: BrandingAssetField,
    file: StorageFile | undefined,
  ): Promise<OrganizationBrandingResponseDto> {
    const organization = await this.getOrganizationOrThrow(organizationId);
    const folder = `organizations/${organizationId}/branding`;
    const upload = await this.storageService.upload(file, folder);
    const currentKey =
      field === 'logo'
        ? organization.branding?.logoKey
        : organization.branding?.iconKey;

    try {
      const branding = await this.settingsRepository.upsertBranding(
        organizationId,
        field === 'logo'
          ? {
              logoUrl: upload.url,
              logoKey: upload.key,
            }
          : {
              iconUrl: upload.url,
              iconKey: upload.key,
            },
      );

      await this.deleteBrandingAssets(currentKey ? [currentKey] : []);

      const response = this.mapBranding(branding);

      this.emitSettingsEvent({
        organizationId,
        resource: 'branding',
        action: 'updated',
        entityId: branding.id,
        data: response,
        invalidate: ['settings.organization', 'analytics.dashboard'],
      });

      return response;
    } catch (error) {
      await this.storageService.delete(upload.key);
      throw error;
    }
  }

  async listSettings(
    organizationId: string,
    query: OrganizationSettingsQueryDto,
  ): Promise<OrganizationSettingResponseDto[]> {
    await this.getOrganizationOrThrow(organizationId);
    const settings = await this.settingsRepository.findSettings(
      organizationId,
      {
        namespace: query.namespace?.trim().toLowerCase(),
      },
    );

    return settings.map((setting) => this.mapSetting(setting));
  }

  async upsertSettings(
    organizationId: string,
    dto: UpsertOrganizationSettingsDto,
  ): Promise<OrganizationSettingResponseDto[]> {
    await this.getOrganizationOrThrow(organizationId);
    const settings = dto.settings.map((setting) =>
      this.normalizeSetting(setting),
    );
    const duplicateKeys = this.findDuplicateSettingKeys(settings);

    if (duplicateKeys.length > 0) {
      throw new BadRequestException({
        message: 'Duplicate settings are not allowed in the same request',
        duplicateSettings: duplicateKeys,
      });
    }

    const savedSettings = await this.settingsRepository.upsertSettings(
      organizationId,
      settings,
    );

    const response = savedSettings.map((setting) => this.mapSetting(setting));

    this.emitSettingsEvent({
      organizationId,
      resource: 'preferences',
      action: 'updated',
      data: response,
      invalidate: ['settings.preferences', 'analytics.dashboard'],
    });

    return response;
  }

  async listModules(
    organizationId: string,
  ): Promise<OrganizationModuleResponseDto[]> {
    await this.getOrganizationOrThrow(organizationId);
    const modules = await this.settingsRepository.findModules(organizationId);

    return modules.map((module) => this.mapModule(module));
  }

  async updateModule(
    organizationId: string,
    moduleKey: string,
    dto: UpdateOrganizationModuleDto,
  ): Promise<OrganizationModuleResponseDto> {
    await this.getOrganizationOrThrow(organizationId);
    const normalizedModuleKey = moduleKey.trim().toLowerCase();

    if (
      normalizedModuleKey === SYSTEM_MODULES.settings &&
      dto.isEnabled === false
    ) {
      throw new ForbiddenException('The settings module cannot be disabled');
    }

    const exists =
      await this.settingsRepository.appModuleExists(normalizedModuleKey);

    if (!exists) {
      throw new NotFoundException('Module was not found in the app catalog');
    }

    const module = await this.settingsRepository.updateModule({
      organizationId,
      moduleKey: normalizedModuleKey,
      dto,
    });

    const response = this.mapModule(module);

    this.emitSettingsEvent({
      organizationId,
      resource: 'module',
      action: 'updated',
      entityId: response.id,
      data: response,
      invalidate: [
        'settings.modules',
        'settings.screens',
        'rbac.access-matrix',
        'analytics.operations',
        'analytics.dashboard',
      ],
    });

    return response;
  }

  async listScreens(
    organizationId: string,
  ): Promise<OrganizationScreenResponseDto[]> {
    await this.getOrganizationOrThrow(organizationId);
    const screens = await this.settingsRepository.findScreens(organizationId);

    return screens.map((screen) => this.mapScreen(screen));
  }

  async createScreen(
    organizationId: string,
    dto: CreateOrganizationScreenDto,
  ): Promise<OrganizationScreenResponseDto> {
    await this.getOrganizationOrThrow(organizationId);
    const normalizedDto = {
      ...dto,
      key: dto.key.trim().toLowerCase(),
      title: dto.title.trim(),
      path: dto.path?.trim(),
      moduleKey: dto.moduleKey?.trim().toLowerCase(),
      requiredPermissionKey: dto.requiredPermissionKey?.trim().toLowerCase(),
    };

    if (normalizedDto.type === ScreenType.SYSTEM) {
      throw new BadRequestException(
        'System screens can only be created from the app catalog',
      );
    }

    await this.assertScreenReferencesExist(normalizedDto);

    const screen = await this.settingsRepository.createScreen({
      organizationId,
      dto: normalizedDto,
    });

    const response = this.mapScreen(screen);

    this.emitSettingsEvent({
      organizationId,
      resource: 'screen',
      action: 'created',
      entityId: response.id,
      data: response,
      invalidate: ['settings.screens', 'rbac.access-matrix'],
    });

    return response;
  }

  async updateScreen(
    organizationId: string,
    screenId: string,
    dto: UpdateOrganizationScreenDto,
  ): Promise<OrganizationScreenResponseDto> {
    await this.getOrganizationOrThrow(organizationId);
    const screen = await this.getScreenOrThrow(organizationId, screenId);

    if (screen.type === ScreenType.SYSTEM && dto.type !== undefined) {
      throw new ForbiddenException('System screen type cannot be changed');
    }

    if (dto.requiredPermissionKey) {
      await this.assertPermissionExists(dto.requiredPermissionKey);
    }

    const updatedScreen = await this.settingsRepository.updateScreen({
      organizationId,
      screenId,
      dto: {
        ...dto,
        title: dto.title?.trim(),
        path: dto.path?.trim(),
        requiredPermissionKey: dto.requiredPermissionKey?.trim().toLowerCase(),
      },
    });

    const response = this.mapScreen(updatedScreen);

    this.emitSettingsEvent({
      organizationId,
      resource: 'screen',
      action: 'updated',
      entityId: response.id,
      data: response,
      invalidate: ['settings.screens', 'rbac.access-matrix'],
    });

    return response;
  }

  async deleteScreen(
    organizationId: string,
    screenId: string,
  ): Promise<OrganizationScreenResponseDto> {
    await this.getOrganizationOrThrow(organizationId);
    const screen = await this.getScreenOrThrow(organizationId, screenId);

    if (screen.type === ScreenType.SYSTEM || screen.appScreenId) {
      throw new ForbiddenException('System screens cannot be deleted');
    }

    const deletedScreen = await this.settingsRepository.deleteScreen(
      organizationId,
      screenId,
    );

    const response = this.mapScreen(deletedScreen);

    this.emitSettingsEvent({
      organizationId,
      resource: 'screen',
      action: 'deleted',
      entityId: response.id,
      data: response,
      invalidate: ['settings.screens', 'rbac.access-matrix'],
    });

    return response;
  }

  private async getOrganizationOrThrow(
    organizationId: string,
  ): Promise<SettingsOrganizationRecord> {
    const organization =
      await this.settingsRepository.findOrganization(organizationId);

    if (!organization) {
      throw new NotFoundException('Organization was not found');
    }

    return organization;
  }

  private async getScreenOrThrow(
    organizationId: string,
    screenId: string,
  ): Promise<SettingsScreenRecord> {
    const screen = await this.settingsRepository.findScreenById(
      organizationId,
      screenId,
    );

    if (!screen) {
      throw new NotFoundException('Screen was not found in this tenant');
    }

    return screen;
  }

  private async assertScreenReferencesExist(
    dto: CreateOrganizationScreenDto,
  ): Promise<void> {
    if (
      dto.moduleKey &&
      !(await this.settingsRepository.appModuleExists(dto.moduleKey))
    ) {
      throw new BadRequestException('Module key does not exist');
    }

    if (dto.requiredPermissionKey) {
      await this.assertPermissionExists(dto.requiredPermissionKey);
    }
  }

  private async assertPermissionExists(permissionKey: string): Promise<void> {
    const exists = await this.settingsRepository.permissionExists(
      permissionKey.trim().toLowerCase(),
    );

    if (!exists) {
      throw new BadRequestException('Required permission key does not exist');
    }
  }

  private normalizeSetting(
    setting: OrganizationSettingInputDto,
  ): OrganizationSettingInputDto {
    if (setting.value === undefined) {
      throw new BadRequestException('Setting value cannot be undefined');
    }

    return {
      namespace: setting.namespace.trim().toLowerCase(),
      key: setting.key.trim().toLowerCase(),
      value: setting.value,
    };
  }

  private findDuplicateSettingKeys(
    settings: OrganizationSettingInputDto[],
  ): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const setting of settings) {
      const key = `${setting.namespace}.${setting.key}`;

      if (seen.has(key)) {
        duplicates.add(key);
      }

      seen.add(key);
    }

    return [...duplicates];
  }

  private mapOrganization(
    organization: SettingsOrganizationRecord,
  ): OrganizationProfileResponseDto {
    return {
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
      legalName: organization.legalName,
      taxId: organization.taxId,
      status: organization.status,
      timezone: organization.timezone,
      locale: organization.locale,
      defaultCurrency: organization.defaultCurrency,
      branding: organization.branding
        ? this.mapBranding(organization.branding)
        : null,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }

  private mapBranding(
    branding: SettingsBrandingRecord,
  ): OrganizationBrandingResponseDto {
    return {
      id: branding.id,
      logoUrl: branding.logoUrl,
      iconUrl: branding.iconUrl,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      accentColor: branding.accentColor,
      theme: branding.theme,
    };
  }

  private normalizeBrandingPayload(dto: UpdateOrganizationBrandingDto): {
    logoUrl?: string | null;
    logoKey?: string | null;
    iconUrl?: string | null;
    iconKey?: string | null;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    theme?: Record<string, unknown>;
  } {
    const normalized: {
      logoUrl?: string | null;
      logoKey?: string | null;
      iconUrl?: string | null;
      iconKey?: string | null;
      primaryColor?: string;
      secondaryColor?: string;
      accentColor?: string;
      theme?: Record<string, unknown>;
    } = {
      primaryColor: dto.primaryColor?.trim(),
      secondaryColor: dto.secondaryColor?.trim(),
      accentColor: dto.accentColor?.trim(),
      theme: dto.theme,
    };

    if (Object.prototype.hasOwnProperty.call(dto, 'logoUrl')) {
      normalized.logoUrl = this.normalizeOptionalString(dto.logoUrl);
      normalized.logoKey = normalized.logoUrl ? undefined : null;
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'iconUrl')) {
      normalized.iconUrl = this.normalizeOptionalString(dto.iconUrl);
      normalized.iconKey = normalized.iconUrl ? undefined : null;
    }

    return normalized;
  }

  private resolveBrandingKeysToDelete(
    currentBranding: SettingsBrandingRecord | null | undefined,
    nextBranding: {
      logoUrl?: string | null;
      iconUrl?: string | null;
    },
  ): string[] {
    const keysToDelete: string[] = [];

    if (
      Object.prototype.hasOwnProperty.call(nextBranding, 'logoUrl') &&
      currentBranding?.logoKey &&
      nextBranding.logoUrl !== currentBranding.logoUrl
    ) {
      keysToDelete.push(currentBranding.logoKey);
    }

    if (
      Object.prototype.hasOwnProperty.call(nextBranding, 'iconUrl') &&
      currentBranding?.iconKey &&
      nextBranding.iconUrl !== currentBranding.iconUrl
    ) {
      keysToDelete.push(currentBranding.iconKey);
    }

    return keysToDelete;
  }

  private async deleteBrandingAssets(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    await Promise.allSettled(
      keys.map((key) => this.storageService.delete(key)),
    );
  }

  private normalizeOptionalString(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private mapSetting(
    setting: SettingsValueRecord,
  ): OrganizationSettingResponseDto {
    return {
      id: setting.id,
      namespace: setting.namespace,
      key: setting.key,
      value: setting.value,
      updatedAt: setting.updatedAt,
    };
  }

  private mapModule(
    module: SettingsModuleRecord,
  ): OrganizationModuleResponseDto {
    return {
      id: module.id,
      module: {
        key: module.module.key,
        name: module.module.name,
        description: module.module.description,
        status: module.module.status,
      },
      isEnabled: module.isEnabled,
      config: module.config,
      sortOrder: module.sortOrder,
      updatedAt: module.updatedAt,
    };
  }

  private mapScreen(
    screen: SettingsScreenRecord,
  ): OrganizationScreenResponseDto {
    return {
      id: screen.id,
      key: screen.key,
      title: screen.title,
      path: screen.path,
      type: screen.type,
      moduleKey: screen.module?.key ?? null,
      requiredPermissionKey: screen.requiredPermissionKey,
      config: screen.config,
      sortOrder: screen.sortOrder,
      isVisible: screen.isVisible,
      updatedAt: screen.updatedAt,
    };
  }

  private emitSettingsEvent(params: {
    organizationId: string;
    resource: string;
    action: string;
    entityId?: string | null;
    data: unknown;
    invalidate: string[];
  }): void {
    this.realtimeService.publishOrganizationEvent({
      organizationId: params.organizationId,
      domain: 'settings',
      resource: params.resource,
      action: params.action,
      entityId: params.entityId,
      data: params.data,
      invalidate: params.invalidate,
    });
  }
}
