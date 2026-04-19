import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { MemberStatus, PlatformRole, UserStatus } from 'generated/prisma/enums';
import { PrismaService } from '../../../database/prisma.service';
import { RegisterOrganizationDto } from '../dto';

const authUserInclude = {
  memberships: {
    where: {
      deletedAt: null,
      status: MemberStatus.ACTIVE,
    },
    include: {
      organization: {
        include: {
          modules: {
            where: { isEnabled: true },
            include: { module: true },
          },
        },
      },
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

export type AuthUserRecord = Prisma.UserGetPayload<{
  include: typeof authUserInclude;
}>;

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    return this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
      include: authUserInclude,
    });
  }

  findUserById(id: string): Promise<AuthUserRecord | null> {
    return this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: authUserInclude,
    });
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } });
    return count > 0;
  }

  async usernameExists(username: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { username } });
    return count > 0;
  }

  async organizationSlugExists(slug: string): Promise<boolean> {
    const count = await this.prisma.organization.count({ where: { slug } });
    return count > 0;
  }

  updateRefreshTokenHash(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<{ id: string }> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
      select: { id: true },
    });
  }

  async createFounderWorkspace(params: {
    dto: RegisterOrganizationDto;
    slug: string;
    passwordHash: string;
  }): Promise<AuthUserRecord> {
    const { dto, slug, passwordHash } = params;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          username: dto.username?.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          platformRole: PlatformRole.USER,
          status: UserStatus.ACTIVE,
        },
      });

      const organization = await tx.organization.create({
        data: {
          slug,
          name: dto.organizationName,
          timezone: dto.timezone ?? 'America/Managua',
          locale: dto.locale ?? 'es-NI',
          defaultCurrency: dto.currency ?? 'USD',
        },
      });

      const member = await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          status: MemberStatus.ACTIVE,
          phone: dto.phone,
          documentId: dto.documentId,
          joinedAt: new Date(),
        },
      });

      const [permissions, appModules, appScreens] = await Promise.all([
        tx.permission.findMany({ select: { id: true } }),
        tx.appModule.findMany({ select: { id: true, sortOrder: true } }),
        tx.appScreen.findMany({
          select: {
            id: true,
            moduleId: true,
            key: true,
            name: true,
            path: true,
            requiredPermissionKey: true,
            sortOrder: true,
            module: { select: { key: true } },
          },
        }),
      ]);

      const adminRole = await tx.role.create({
        data: {
          organizationId: organization.id,
          key: 'admin',
          name: 'Admin',
          description: 'Full organization administration.',
          isSystem: true,
        },
      });

      if (permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: adminRole.id,
            permissionId: permission.id,
          })),
          skipDuplicates: true,
        });
      }

      await tx.memberRole.create({
        data: {
          memberId: member.id,
          roleId: adminRole.id,
        },
      });

      if (appModules.length > 0) {
        await tx.organizationModule.createMany({
          data: appModules.map((module) => ({
            organizationId: organization.id,
            moduleId: module.id,
            isEnabled: true,
            sortOrder: module.sortOrder,
          })),
          skipDuplicates: true,
        });
      }

      if (appScreens.length > 0) {
        await tx.organizationScreen.createMany({
          data: appScreens.map((screen) => ({
            organizationId: organization.id,
            appScreenId: screen.id,
            moduleId: screen.moduleId,
            key: `${screen.module.key}.${screen.key}`,
            title: screen.name,
            path: screen.path,
            requiredPermissionKey: screen.requiredPermissionKey,
            sortOrder: screen.sortOrder,
            isVisible: true,
          })),
          skipDuplicates: true,
        });
      }

      await tx.organizationSetting.createMany({
        data: [
          {
            organizationId: organization.id,
            namespace: 'billing',
            key: 'currency',
            value: dto.currency ?? 'USD',
          },
          {
            organizationId: organization.id,
            namespace: 'security',
            key: 'require_2fa_for_admins',
            value: false,
          },
        ],
        skipDuplicates: true,
      });

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: authUserInclude,
      });
    });
  }
}
