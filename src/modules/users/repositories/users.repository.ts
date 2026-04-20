import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { Prisma } from 'generated/prisma/client';
import {
  InvitationStatus,
  MemberStatus,
  PlatformRole,
  UserStatus,
} from 'generated/prisma/enums';
import {
  buildCursorPagination,
  getCursorId,
  PaginatedResult,
} from '../../../common';
import { PrismaService } from '../../../database/prisma.service';
import { InvitationQueryDto, MemberQueryDto } from '../dto';

const memberInclude = {
  user: true,
  roles: {
    include: {
      role: true,
    },
    orderBy: {
      role: {
        key: 'asc',
      },
    },
  },
} satisfies Prisma.OrganizationMemberInclude;

export type UserMemberRecord = Prisma.OrganizationMemberGetPayload<{
  include: typeof memberInclude;
}>;

export type UserInvitationRecord = Prisma.InvitationGetPayload<object>;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMembersPage(
    organizationId: string,
    query: MemberQueryDto,
  ): Promise<PaginatedResult<UserMemberRecord>> {
    const cursorId = getCursorId(query.cursor);
    const where: Prisma.OrganizationMemberWhereInput = {
      organizationId,
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { phone: { contains: query.search, mode: 'insensitive' } },
          { documentId: { contains: query.search, mode: 'insensitive' } },
          {
            user: {
              email: { contains: query.search, mode: 'insensitive' },
            },
          },
          {
            user: {
              firstName: { contains: query.search, mode: 'insensitive' },
            },
          },
          {
            user: {
              lastName: { contains: query.search, mode: 'insensitive' },
            },
          },
        ],
      }),
    };

    const records = await this.prisma.organizationMember.findMany({
      where,
      include: memberInclude,
      take: query.limit + 1,
      ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
      orderBy: [
        {
          [query.sortBy]: query.sortDirection,
        } as Prisma.OrganizationMemberOrderByWithRelationInput,
        { id: query.sortDirection },
      ],
    });

    return buildCursorPagination(records, query);
  }

  findMemberById(
    organizationId: string,
    memberId: string,
  ): Promise<UserMemberRecord | null> {
    return this.prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId,
        deletedAt: null,
      },
      include: memberInclude,
    });
  }

  findMembershipByUserId(params: {
    organizationId: string;
    userId: string;
  }): Promise<UserMemberRecord | null> {
    return this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: params.organizationId,
          userId: params.userId,
        },
      },
      include: memberInclude,
    });
  }

  findUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async usernameBelongsToAnotherUser(params: {
    username: string;
    userId?: string;
  }): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        username: params.username,
        ...(params.userId && { id: { not: params.userId } }),
      },
    });

    return count > 0;
  }

  async documentIdBelongsToAnotherMember(params: {
    organizationId: string;
    documentId: string;
    memberId?: string;
  }): Promise<boolean> {
    const count = await this.prisma.organizationMember.count({
      where: {
        organizationId: params.organizationId,
        documentId: params.documentId,
        ...(params.memberId && { id: { not: params.memberId } }),
      },
    });

    return count > 0;
  }

  async findRoleIdsByKeys(
    organizationId: string,
    roleKeys: string[],
  ): Promise<{ id: string; key: string }[]> {
    if (roleKeys.length === 0) {
      return [];
    }

    return this.prisma.role.findMany({
      where: {
        organizationId,
        key: { in: roleKeys },
      },
      select: { id: true, key: true },
    });
  }

  async findDefaultRoleIds(
    organizationId: string,
  ): Promise<{ id: string; key: string }[]> {
    return this.prisma.role.findMany({
      where: {
        organizationId,
        OR: [{ isDefault: true }, { key: 'customer' }],
      },
      select: { id: true, key: true },
      orderBy: [{ isDefault: 'desc' }, { key: 'asc' }],
      take: 1,
    });
  }

  async createMember(params: {
    organizationId: string;
    email: string;
    username?: string;
    firstName: string;
    lastName: string;
    passwordHash?: string;
    phone?: string;
    documentId?: string;
    address?: string;
    roleIds: string[];
  }): Promise<UserMemberRecord> {
    return this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findFirst({
        where: { email: params.email, deletedAt: null },
      });

      if (!user) {
        if (!params.passwordHash) {
          throw new Error('Password hash is required for new users');
        }

        user = await tx.user.create({
          data: {
            email: params.email,
            username: params.username,
            passwordHash: params.passwordHash,
            firstName: params.firstName,
            lastName: params.lastName,
            platformRole: PlatformRole.USER,
            status: UserStatus.ACTIVE,
          },
        });
      }

      const existingMember = await tx.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: params.organizationId,
            userId: user.id,
          },
        },
      });

      const member = existingMember
        ? await tx.organizationMember.update({
            where: { id: existingMember.id },
            data: {
              status: MemberStatus.ACTIVE,
              phone: params.phone,
              documentId: params.documentId,
              address: params.address,
              joinedAt: existingMember.joinedAt ?? new Date(),
              deletedAt: null,
            },
          })
        : await tx.organizationMember.create({
            data: {
              organizationId: params.organizationId,
              userId: user.id,
              status: MemberStatus.ACTIVE,
              phone: params.phone,
              documentId: params.documentId,
              address: params.address,
              joinedAt: new Date(),
            },
          });

      await tx.memberRole.deleteMany({ where: { memberId: member.id } });

      if (params.roleIds.length > 0) {
        await tx.memberRole.createMany({
          data: params.roleIds.map((roleId) => ({
            memberId: member.id,
            roleId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.organizationMember.findUniqueOrThrow({
        where: { id: member.id },
        include: memberInclude,
      });
    });
  }

  updateMember(params: {
    organizationId: string;
    memberId: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    documentId?: string;
    address?: string;
  }): Promise<UserMemberRecord> {
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.organizationMember.findFirstOrThrow({
        where: {
          id: params.memberId,
          organizationId: params.organizationId,
          deletedAt: null,
        },
      });

      if (params.firstName || params.lastName) {
        await tx.user.update({
          where: { id: member.userId },
          data: {
            firstName: params.firstName,
            lastName: params.lastName,
          },
        });
      }

      return tx.organizationMember.update({
        where: { id: member.id },
        data: {
          phone: params.phone,
          documentId: params.documentId,
          address: params.address,
        },
        include: memberInclude,
      });
    });
  }

  updateMemberStatus(params: {
    organizationId: string;
    memberId: string;
    status: MemberStatus;
  }): Promise<UserMemberRecord> {
    return this.prisma.organizationMember.update({
      where: {
        id: params.memberId,
        organizationId: params.organizationId,
      },
      data: { status: params.status },
      include: memberInclude,
    });
  }

  removeMember(
    organizationId: string,
    memberId: string,
  ): Promise<UserMemberRecord> {
    return this.prisma.organizationMember.update({
      where: {
        id: memberId,
        organizationId,
      },
      data: {
        status: MemberStatus.REMOVED,
        deletedAt: new Date(),
      },
      include: memberInclude,
    });
  }

  async findInvitationsPage(
    organizationId: string,
    query: InvitationQueryDto,
  ): Promise<PaginatedResult<UserInvitationRecord>> {
    const cursorId = getCursorId(query.cursor);
    const where: Prisma.InvitationWhereInput = {
      organizationId,
      ...(query.status && { status: query.status }),
      ...(query.search && {
        email: { contains: query.search, mode: 'insensitive' },
      }),
    };

    const records = await this.prisma.invitation.findMany({
      where,
      take: query.limit + 1,
      ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
      orderBy: [
        { createdAt: query.sortDirection },
        { id: query.sortDirection },
      ],
    });

    return buildCursorPagination(records, query);
  }

  findPendingInvitationByEmail(organizationId: string, email: string) {
    return this.prisma.invitation.findFirst({
      where: {
        organizationId,
        email,
        status: InvitationStatus.PENDING,
      },
    });
  }

  findInvitationById(
    organizationId: string,
    invitationId: string,
  ): Promise<UserInvitationRecord | null> {
    return this.prisma.invitation.findFirst({
      where: {
        id: invitationId,
        organizationId,
      },
    });
  }

  createInvitation(params: {
    organizationId: string;
    invitedByMemberId?: string;
    email: string;
    expiresAt: Date;
  }): Promise<UserInvitationRecord & { token: string }> {
    const token = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(token);

    return this.prisma.invitation
      .create({
        data: {
          organizationId: params.organizationId,
          invitedByMemberId: params.invitedByMemberId,
          email: params.email,
          tokenHash,
          expiresAt: params.expiresAt,
          status: InvitationStatus.PENDING,
        },
      })
      .then((invitation) => ({ ...invitation, token }));
  }

  revokeInvitation(
    organizationId: string,
    invitationId: string,
  ): Promise<UserInvitationRecord> {
    return this.prisma.invitation.update({
      where: {
        id: invitationId,
        organizationId,
      },
      data: {
        status: InvitationStatus.REVOKED,
        revokedAt: new Date(),
      },
    });
  }

  findInvitationByToken(token: string): Promise<UserInvitationRecord | null> {
    return this.prisma.invitation.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });
  }

  expireInvitation(invitationId: string): Promise<UserInvitationRecord> {
    return this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.EXPIRED },
    });
  }

  async acceptInvitation(params: {
    invitationId: string;
    organizationId: string;
    email: string;
    username?: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    phone?: string;
    documentId?: string;
    address?: string;
    roleIds: string[];
  }): Promise<{ member: UserMemberRecord; invitation: UserInvitationRecord }> {
    return this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findFirst({
        where: { email: params.email, deletedAt: null },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            email: params.email,
            username: params.username,
            passwordHash: params.passwordHash,
            firstName: params.firstName,
            lastName: params.lastName,
            platformRole: PlatformRole.USER,
            status: UserStatus.ACTIVE,
          },
        });
      }

      const existingMember = await tx.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: params.organizationId,
            userId: user.id,
          },
        },
      });

      const member = existingMember
        ? await tx.organizationMember.update({
            where: { id: existingMember.id },
            data: {
              status: MemberStatus.ACTIVE,
              phone: params.phone,
              documentId: params.documentId,
              address: params.address,
              joinedAt: existingMember.joinedAt ?? new Date(),
              deletedAt: null,
            },
          })
        : await tx.organizationMember.create({
            data: {
              organizationId: params.organizationId,
              userId: user.id,
              status: MemberStatus.ACTIVE,
              phone: params.phone,
              documentId: params.documentId,
              address: params.address,
              joinedAt: new Date(),
            },
          });

      if (params.roleIds.length > 0) {
        await tx.memberRole.createMany({
          data: params.roleIds.map((roleId) => ({
            memberId: member.id,
            roleId,
          })),
          skipDuplicates: true,
        });
      }

      const invitation = await tx.invitation.update({
        where: { id: params.invitationId },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      const hydratedMember = await tx.organizationMember.findUniqueOrThrow({
        where: { id: member.id },
        include: memberInclude,
      });

      return { member: hydratedMember, invitation };
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
