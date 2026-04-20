import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { MemberStatus } from 'generated/prisma/enums';
import { PrismaService } from '../../../database/prisma.service';
import {
  buildCursorPagination,
  getCursorId,
  PaginatedResult,
} from '../../../common';
import { RbacRoleQueryDto } from '../dto';

const permissionInclude = {
  module: true,
} satisfies Prisma.PermissionInclude;

const roleInclude = {
  _count: {
    select: {
      members: true,
    },
  },
  permissions: {
    include: {
      permission: {
        include: permissionInclude,
      },
    },
    orderBy: {
      permission: {
        key: 'asc',
      },
    },
  },
} satisfies Prisma.RoleInclude;

const memberRoleInclude = {
  roles: {
    include: {
      role: {
        include: roleInclude,
      },
    },
    orderBy: {
      role: {
        key: 'asc',
      },
    },
  },
} satisfies Prisma.OrganizationMemberInclude;

export type RbacPermissionRecord = Prisma.PermissionGetPayload<{
  include: typeof permissionInclude;
}>;

export type RbacRoleRecord = Prisma.RoleGetPayload<{
  include: typeof roleInclude;
}>;

export type RbacMemberRoleRecord = Prisma.OrganizationMemberGetPayload<{
  include: typeof memberRoleInclude;
}>;

export type RbacAccessModuleRecord = Prisma.OrganizationModuleGetPayload<{
  include: {
    module: {
      include: {
        permissions: {
          include: typeof permissionInclude;
        };
      };
    };
    organization: {
      include: {
        screens: true;
      };
    };
  };
}>;

@Injectable()
export class RbacRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPermissions(params?: {
    moduleKey?: string;
  }): Promise<RbacPermissionRecord[]> {
    return this.prisma.permission.findMany({
      where: params?.moduleKey
        ? {
            module: {
              key: params.moduleKey,
            },
          }
        : undefined,
      include: permissionInclude,
      orderBy: [{ key: 'asc' }],
    });
  }

  async findExistingPermissionKeys(
    permissionKeys: string[],
  ): Promise<string[]> {
    if (permissionKeys.length === 0) {
      return [];
    }

    const permissions = await this.prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
      select: { key: true },
    });

    return permissions.map((permission) => permission.key);
  }

  async findExistingRoleKeys(
    organizationId: string,
    roleKeys: string[],
  ): Promise<string[]> {
    if (roleKeys.length === 0) {
      return [];
    }

    const roles = await this.prisma.role.findMany({
      where: {
        organizationId,
        key: { in: roleKeys },
      },
      select: { key: true },
    });

    return roles.map((role) => role.key);
  }

  async findRolesPage(
    organizationId: string,
    query: RbacRoleQueryDto,
  ): Promise<PaginatedResult<RbacRoleRecord>> {
    const cursorId = getCursorId(query.cursor);
    const where: Prisma.RoleWhereInput = {
      organizationId,
      ...(query.search && {
        OR: [
          { key: { contains: query.search, mode: 'insensitive' } },
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const records = await this.prisma.role.findMany({
      where,
      include: roleInclude,
      take: query.limit + 1,
      ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
      orderBy: [
        {
          [query.sortBy]: query.sortDirection,
        } as Prisma.RoleOrderByWithRelationInput,
        { id: query.sortDirection },
      ],
    });

    return buildCursorPagination(records, query);
  }

  findRoleById(
    organizationId: string,
    roleId: string,
  ): Promise<RbacRoleRecord | null> {
    return this.prisma.role.findFirst({
      where: {
        id: roleId,
        organizationId,
      },
      include: roleInclude,
    });
  }

  findRoleByKey(
    organizationId: string,
    key: string,
  ): Promise<RbacRoleRecord | null> {
    return this.prisma.role.findFirst({
      where: {
        organizationId,
        key,
      },
      include: roleInclude,
    });
  }

  async createRole(params: {
    organizationId: string;
    key: string;
    name: string;
    description?: string;
    isDefault?: boolean;
    permissionKeys: string[];
  }): Promise<RbacRoleRecord> {
    return this.prisma.$transaction(async (tx) => {
      if (params.isDefault) {
        await tx.role.updateMany({
          where: { organizationId: params.organizationId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const permissions = await tx.permission.findMany({
        where: { key: { in: params.permissionKeys } },
        select: { id: true },
      });

      const role = await tx.role.create({
        data: {
          organizationId: params.organizationId,
          key: params.key,
          name: params.name,
          description: params.description,
          isDefault: params.isDefault ?? false,
          isSystem: false,
        },
      });

      if (permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: role.id,
            permissionId: permission.id,
          })),
          skipDuplicates: true,
        });
      }

      return tx.role.findUniqueOrThrow({
        where: { id: role.id },
        include: roleInclude,
      });
    });
  }

  async updateRole(params: {
    organizationId: string;
    roleId: string;
    name?: string;
    description?: string;
    isDefault?: boolean;
  }): Promise<RbacRoleRecord> {
    return this.prisma.$transaction(async (tx) => {
      if (params.isDefault) {
        await tx.role.updateMany({
          where: {
            organizationId: params.organizationId,
            isDefault: true,
            id: { not: params.roleId },
          },
          data: { isDefault: false },
        });
      }

      return tx.role.update({
        where: {
          id: params.roleId,
          organizationId: params.organizationId,
        },
        data: {
          name: params.name,
          description: params.description,
          isDefault: params.isDefault,
        },
        include: roleInclude,
      });
    });
  }

  async replaceRolePermissions(params: {
    organizationId: string;
    roleId: string;
    permissionKeys: string[];
  }): Promise<RbacRoleRecord> {
    return this.prisma.$transaction(async (tx) => {
      const permissions = await tx.permission.findMany({
        where: { key: { in: params.permissionKeys } },
        select: { id: true },
      });

      await tx.rolePermission.deleteMany({
        where: {
          role: {
            id: params.roleId,
            organizationId: params.organizationId,
          },
        },
      });

      if (permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: params.roleId,
            permissionId: permission.id,
          })),
          skipDuplicates: true,
        });
      }

      return tx.role.findFirstOrThrow({
        where: { id: params.roleId, organizationId: params.organizationId },
        include: roleInclude,
      });
    });
  }

  deleteRole(organizationId: string, roleId: string): Promise<RbacRoleRecord> {
    return this.prisma.role.delete({
      where: {
        id: roleId,
        organizationId,
      },
      include: roleInclude,
    });
  }

  findMemberRoles(
    organizationId: string,
    memberId: string,
  ): Promise<RbacMemberRoleRecord | null> {
    return this.prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId,
        status: { not: MemberStatus.REMOVED },
      },
      include: memberRoleInclude,
    });
  }

  async replaceMemberRoles(params: {
    organizationId: string;
    memberId: string;
    roleKeys: string[];
  }): Promise<RbacMemberRoleRecord> {
    return this.prisma.$transaction(async (tx) => {
      const roles = await tx.role.findMany({
        where: {
          organizationId: params.organizationId,
          key: { in: params.roleKeys },
        },
        select: { id: true },
      });

      await tx.memberRole.deleteMany({
        where: {
          member: {
            id: params.memberId,
            organizationId: params.organizationId,
          },
        },
      });

      await tx.memberRole.createMany({
        data: roles.map((role) => ({
          memberId: params.memberId,
          roleId: role.id,
        })),
        skipDuplicates: true,
      });

      return tx.organizationMember.findFirstOrThrow({
        where: {
          id: params.memberId,
          organizationId: params.organizationId,
        },
        include: memberRoleInclude,
      });
    });
  }

  findAccessModules(organizationId: string): Promise<RbacAccessModuleRecord[]> {
    return this.prisma.organizationModule.findMany({
      where: { organizationId },
      include: {
        module: {
          include: {
            permissions: {
              include: permissionInclude,
              orderBy: { key: 'asc' },
            },
          },
        },
        organization: {
          include: {
            screens: {
              orderBy: [{ sortOrder: 'asc' }, { key: 'asc' }],
            },
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }],
    });
  }
}
