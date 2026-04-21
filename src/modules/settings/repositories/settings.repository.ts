import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { ScreenType } from 'generated/prisma/enums';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateOrganizationScreenDto,
  OrganizationSettingsQueryDto,
  UpdateOrganizationBrandingDto,
  UpdateOrganizationModuleDto,
  UpdateOrganizationProfileDto,
  UpdateOrganizationScreenDto,
} from '../dto';

const organizationInclude = {
  branding: true,
} satisfies Prisma.OrganizationInclude;

const organizationModuleInclude = {
  module: true,
} satisfies Prisma.OrganizationModuleInclude;

const organizationScreenInclude = {
  module: true,
  appScreen: true,
} satisfies Prisma.OrganizationScreenInclude;

export type SettingsOrganizationRecord = Prisma.OrganizationGetPayload<{
  include: typeof organizationInclude;
}>;

export type SettingsBrandingRecord =
  Prisma.OrganizationBrandingGetPayload<object>;
export type SettingsValueRecord = Prisma.OrganizationSettingGetPayload<object>;
export type SettingsModuleRecord = Prisma.OrganizationModuleGetPayload<{
  include: typeof organizationModuleInclude;
}>;
export type SettingsScreenRecord = Prisma.OrganizationScreenGetPayload<{
  include: typeof organizationScreenInclude;
}>;

type UpdateOrganizationBrandingInput = {
  logoUrl?: string | null;
  logoKey?: string | null;
  iconUrl?: string | null;
  iconKey?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  theme?: Prisma.InputJsonValue | undefined;
};

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOrganization(
    organizationId: string,
  ): Promise<SettingsOrganizationRecord | null> {
    return this.prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      include: organizationInclude,
    });
  }

  updateOrganization(
    organizationId: string,
    dto: UpdateOrganizationProfileDto,
  ): Promise<SettingsOrganizationRecord> {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: dto.name,
        legalName: dto.legalName,
        taxId: dto.taxId,
        timezone: dto.timezone,
        locale: dto.locale,
        defaultCurrency: dto.defaultCurrency,
      },
      include: organizationInclude,
    });
  }

  upsertBranding(
    organizationId: string,
    dto: UpdateOrganizationBrandingDto & {
      logoKey?: string | null;
      iconKey?: string | null;
    },
  ): Promise<SettingsBrandingRecord> {
    const data: UpdateOrganizationBrandingInput = {
      logoUrl: dto.logoUrl,
      logoKey: dto.logoKey,
      iconUrl: dto.iconUrl,
      iconKey: dto.iconKey,
      primaryColor: dto.primaryColor,
      secondaryColor: dto.secondaryColor,
      accentColor: dto.accentColor,
      theme: dto.theme as Prisma.InputJsonValue | undefined,
    };

    return this.prisma.organizationBranding.upsert({
      where: { organizationId },
      create: {
        organizationId,
        ...data,
      },
      update: data,
    });
  }

  findSettings(
    organizationId: string,
    query: OrganizationSettingsQueryDto,
  ): Promise<SettingsValueRecord[]> {
    return this.prisma.organizationSetting.findMany({
      where: {
        organizationId,
        ...(query.namespace && { namespace: query.namespace }),
      },
      orderBy: [{ namespace: 'asc' }, { key: 'asc' }],
    });
  }

  async upsertSettings(
    organizationId: string,
    settings: { namespace: string; key: string; value: unknown }[],
  ): Promise<SettingsValueRecord[]> {
    return this.prisma.$transaction(async (tx) => {
      await Promise.all(
        settings.map((setting) =>
          tx.organizationSetting.upsert({
            where: {
              organizationId_namespace_key: {
                organizationId,
                namespace: setting.namespace,
                key: setting.key,
              },
            },
            create: {
              organizationId,
              namespace: setting.namespace,
              key: setting.key,
              value: setting.value as Prisma.InputJsonValue,
            },
            update: {
              value: setting.value as Prisma.InputJsonValue,
            },
          }),
        ),
      );

      return tx.organizationSetting.findMany({
        where: {
          organizationId,
          OR: settings.map((setting) => ({
            namespace: setting.namespace,
            key: setting.key,
          })),
        },
        orderBy: [{ namespace: 'asc' }, { key: 'asc' }],
      });
    });
  }

  findModules(organizationId: string): Promise<SettingsModuleRecord[]> {
    return this.prisma.organizationModule.findMany({
      where: { organizationId },
      include: organizationModuleInclude,
      orderBy: [{ sortOrder: 'asc' }],
    });
  }

  async appModuleExists(moduleKey: string): Promise<boolean> {
    const count = await this.prisma.appModule.count({
      where: { key: moduleKey },
    });

    return count > 0;
  }

  async permissionExists(permissionKey: string): Promise<boolean> {
    const count = await this.prisma.permission.count({
      where: { key: permissionKey },
    });

    return count > 0;
  }

  async updateModule(params: {
    organizationId: string;
    moduleKey: string;
    dto: UpdateOrganizationModuleDto;
  }): Promise<SettingsModuleRecord> {
    return this.prisma.$transaction(async (tx) => {
      const appModule = await tx.appModule.findUniqueOrThrow({
        where: { key: params.moduleKey },
        include: { screens: true },
      });

      const organizationModule = await tx.organizationModule.upsert({
        where: {
          organizationId_moduleId: {
            organizationId: params.organizationId,
            moduleId: appModule.id,
          },
        },
        create: {
          organizationId: params.organizationId,
          moduleId: appModule.id,
          isEnabled: params.dto.isEnabled ?? true,
          sortOrder: params.dto.sortOrder ?? appModule.sortOrder,
          config: params.dto.config as Prisma.InputJsonValue | undefined,
        },
        update: {
          isEnabled: params.dto.isEnabled,
          sortOrder: params.dto.sortOrder,
          config: params.dto.config as Prisma.InputJsonValue | undefined,
        },
        include: organizationModuleInclude,
      });

      if (params.dto.isEnabled === false) {
        await tx.organizationScreen.updateMany({
          where: {
            organizationId: params.organizationId,
            moduleId: appModule.id,
          },
          data: { isVisible: false },
        });
      }

      if (params.dto.isEnabled === true) {
        await tx.organizationScreen.createMany({
          data: appModule.screens.map((screen) => ({
            organizationId: params.organizationId,
            appScreenId: screen.id,
            moduleId: appModule.id,
            key: `${appModule.key}.${screen.key}`,
            title: screen.name,
            path: screen.path,
            requiredPermissionKey: screen.requiredPermissionKey,
            sortOrder: screen.sortOrder,
            type: ScreenType.SYSTEM,
            isVisible: true,
          })),
          skipDuplicates: true,
        });
      }

      return organizationModule;
    });
  }

  findScreens(organizationId: string): Promise<SettingsScreenRecord[]> {
    return this.prisma.organizationScreen.findMany({
      where: { organizationId },
      include: organizationScreenInclude,
      orderBy: [{ sortOrder: 'asc' }, { key: 'asc' }],
    });
  }

  async createScreen(params: {
    organizationId: string;
    dto: CreateOrganizationScreenDto;
  }): Promise<SettingsScreenRecord> {
    const module = params.dto.moduleKey
      ? await this.prisma.appModule.findUnique({
          where: { key: params.dto.moduleKey },
          select: { id: true },
        })
      : null;

    return this.prisma.organizationScreen.create({
      data: {
        organizationId: params.organizationId,
        moduleId: module?.id,
        key: params.dto.key,
        title: params.dto.title,
        path: params.dto.path,
        type: params.dto.type,
        requiredPermissionKey: params.dto.requiredPermissionKey,
        sortOrder: params.dto.sortOrder ?? 0,
        isVisible: params.dto.isVisible ?? true,
        config: params.dto.config as Prisma.InputJsonValue | undefined,
      },
      include: organizationScreenInclude,
    });
  }

  findScreenById(
    organizationId: string,
    screenId: string,
  ): Promise<SettingsScreenRecord | null> {
    return this.prisma.organizationScreen.findFirst({
      where: { id: screenId, organizationId },
      include: organizationScreenInclude,
    });
  }

  updateScreen(params: {
    organizationId: string;
    screenId: string;
    dto: UpdateOrganizationScreenDto;
  }): Promise<SettingsScreenRecord> {
    return this.prisma.organizationScreen.update({
      where: {
        id: params.screenId,
        organizationId: params.organizationId,
      },
      data: {
        title: params.dto.title,
        path: params.dto.path,
        type: params.dto.type,
        requiredPermissionKey: params.dto.requiredPermissionKey,
        sortOrder: params.dto.sortOrder,
        isVisible: params.dto.isVisible,
        config: params.dto.config as Prisma.InputJsonValue | undefined,
      },
      include: organizationScreenInclude,
    });
  }

  deleteScreen(
    organizationId: string,
    screenId: string,
  ): Promise<SettingsScreenRecord> {
    return this.prisma.organizationScreen.delete({
      where: {
        id: screenId,
        organizationId,
      },
      include: organizationScreenInclude,
    });
  }
}
