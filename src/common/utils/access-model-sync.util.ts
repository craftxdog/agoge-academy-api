import { Prisma } from '../../../generated/prisma/client';
import { ScreenType } from '../../../generated/prisma/enums';
import {
  buildSystemRoleDefinitions,
  SYSTEM_ACCESS_CATALOG,
  SYSTEM_ENDPOINT_PERMISSION_RULES,
  SYSTEM_MODULE_STATUS,
} from '../constants/access-model.constant';

type AccessModelPrismaClient = Prisma.TransactionClient;

export async function ensureSystemAccessCatalog(
  prisma: AccessModelPrismaClient,
): Promise<void> {
  for (const moduleDefinition of SYSTEM_ACCESS_CATALOG) {
    const moduleRecord = await prisma.appModule.upsert({
      where: { key: moduleDefinition.key },
      create: {
        key: moduleDefinition.key,
        name: moduleDefinition.name,
        description: moduleDefinition.description,
        sortOrder: moduleDefinition.sortOrder,
        status: SYSTEM_MODULE_STATUS,
      },
      update: {
        name: moduleDefinition.name,
        description: moduleDefinition.description,
        sortOrder: moduleDefinition.sortOrder,
        status: SYSTEM_MODULE_STATUS,
      },
    });

    for (const permissionDefinition of moduleDefinition.permissions) {
      await prisma.permission.upsert({
        where: { key: permissionDefinition.key },
        create: {
          moduleId: moduleRecord.id,
          key: permissionDefinition.key,
          name: permissionDefinition.name,
          description: permissionDefinition.description,
        },
        update: {
          moduleId: moduleRecord.id,
          name: permissionDefinition.name,
          description: permissionDefinition.description,
        },
      });
    }

    for (const screenDefinition of moduleDefinition.screens) {
      await prisma.appScreen.upsert({
        where: {
          moduleId_key: {
            moduleId: moduleRecord.id,
            key: screenDefinition.key,
          },
        },
        create: {
          moduleId: moduleRecord.id,
          key: screenDefinition.key,
          name: screenDefinition.name,
          path: screenDefinition.path,
          requiredPermissionKey: screenDefinition.requiredPermissionKey,
          sortOrder: screenDefinition.sortOrder,
        },
        update: {
          name: screenDefinition.name,
          path: screenDefinition.path,
          requiredPermissionKey: screenDefinition.requiredPermissionKey,
          sortOrder: screenDefinition.sortOrder,
        },
      });
    }
  }

  await syncEndpointPermissionRules(prisma);
}

async function syncEndpointPermissionRules(
  prisma: AccessModelPrismaClient,
): Promise<void> {
  for (const rule of SYSTEM_ENDPOINT_PERMISSION_RULES) {
    for (const permissionKey of rule.permissionKeys) {
      await prisma.$executeRaw`
        INSERT INTO "endpoint_permission_rules" (
          "id",
          "method",
          "path_pattern",
          "permission_key",
          "description",
          "is_active",
          "created_at",
          "updated_at"
        )
        VALUES (
          gen_random_uuid(),
          ${rule.method.toUpperCase()},
          ${rule.pathPattern},
          ${permissionKey},
          ${rule.description},
          TRUE,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT ("method", "path_pattern", "permission_key") DO UPDATE SET
          "description" = EXCLUDED."description",
          "is_active" = TRUE,
          "updated_at" = CURRENT_TIMESTAMP
      `;
    }
  }
}

export async function syncOrganizationAccessModel(
  prisma: AccessModelPrismaClient,
  organizationId: string,
  options?: {
    forceVisibleSystemScreens?: boolean;
  },
): Promise<void> {
  const modules = await prisma.appModule.findMany({
    include: {
      screens: {
        orderBy: [{ sortOrder: 'asc' }, { key: 'asc' }],
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { key: 'asc' }],
  });

  for (const module of modules) {
    await prisma.organizationModule.upsert({
      where: {
        organizationId_moduleId: {
          organizationId,
          moduleId: module.id,
        },
      },
      create: {
        organizationId,
        moduleId: module.id,
        isEnabled: true,
        sortOrder: module.sortOrder,
      },
      update: {
        sortOrder: module.sortOrder,
      },
    });

    for (const screen of module.screens) {
      await prisma.organizationScreen.upsert({
        where: {
          organizationId_key: {
            organizationId,
            key: `${module.key}.${screen.key}`,
          },
        },
        create: {
          organizationId,
          appScreenId: screen.id,
          moduleId: module.id,
          key: `${module.key}.${screen.key}`,
          title: screen.name,
          path: screen.path,
          type: ScreenType.SYSTEM,
          requiredPermissionKey: screen.requiredPermissionKey,
          sortOrder: screen.sortOrder,
          isVisible: true,
        },
        update: {
          appScreenId: screen.id,
          moduleId: module.id,
          title: screen.name,
          path: screen.path,
          type: ScreenType.SYSTEM,
          requiredPermissionKey: screen.requiredPermissionKey,
          sortOrder: screen.sortOrder,
          ...(options?.forceVisibleSystemScreens ? { isVisible: true } : {}),
        },
      });
    }
  }
}

export async function ensureSystemRoles(
  prisma: AccessModelPrismaClient,
  organizationId: string,
): Promise<void> {
  const permissions = await prisma.permission.findMany({
    select: {
      id: true,
      key: true,
    },
    orderBy: [{ key: 'asc' }],
  });
  const permissionIdsByKey = new Map(
    permissions.map((permission) => [permission.key, permission.id]),
  );

  for (const roleDefinition of buildSystemRoleDefinitions(
    permissions.map((permission) => permission.key),
  )) {
    if (roleDefinition.isDefault) {
      await prisma.role.updateMany({
        where: {
          organizationId,
          isDefault: true,
          key: { not: roleDefinition.key },
        },
        data: { isDefault: false },
      });
    }

    const role = await prisma.role.upsert({
      where: {
        organizationId_key: {
          organizationId,
          key: roleDefinition.key,
        },
      },
      create: {
        organizationId,
        key: roleDefinition.key,
        name: roleDefinition.name,
        description: roleDefinition.description,
        isSystem: roleDefinition.isSystem,
        isDefault: roleDefinition.isDefault,
      },
      update: {
        name: roleDefinition.name,
        description: roleDefinition.description,
        isSystem: roleDefinition.isSystem,
        isDefault: roleDefinition.isDefault,
      },
    });

    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    const permissionIds = roleDefinition.permissionKeys
      .map((permissionKey) => permissionIdsByKey.get(permissionKey))
      .filter((permissionId): permissionId is string => Boolean(permissionId));

    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }
  }
}
