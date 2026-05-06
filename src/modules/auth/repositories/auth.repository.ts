import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { MemberStatus, PlatformRole, UserStatus } from 'generated/prisma/enums';
import {
  ensureSystemAccessCatalog,
  ensureSystemRoles,
  syncOrganizationAccessModel,
  SYSTEM_ROLES,
} from '../../../common';
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
    passwordHash?: string;
    existingUserId?: string;
  }): Promise<AuthUserRecord> {
    const { dto, slug, passwordHash, existingUserId } = params;

    return this.prisma.$transaction(async (tx) => {
      const user = existingUserId
        ? await tx.user.findUniqueOrThrow({
            where: { id: existingUserId },
            select: { id: true },
          })
        : await tx.user.create({
            data: {
              email: dto.email.toLowerCase(),
              username: dto.username?.toLowerCase(),
              passwordHash: passwordHash!,
              firstName: dto.firstName,
              lastName: dto.lastName,
              platformRole: PlatformRole.USER,
              status: UserStatus.ACTIVE,
            },
            select: { id: true },
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

      await ensureSystemAccessCatalog(tx);
      await syncOrganizationAccessModel(tx, organization.id);
      await ensureSystemRoles(tx, organization.id);

      const adminRole = await tx.role.findFirstOrThrow({
        where: {
          organizationId: organization.id,
          key: SYSTEM_ROLES.admin,
        },
        select: { id: true },
      });

      await tx.memberRole.create({
        data: {
          memberId: member.id,
          roleId: adminRole.id,
        },
      });

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
