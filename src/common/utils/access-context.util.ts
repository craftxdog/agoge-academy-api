import { Prisma } from 'generated/prisma/client';
import { MemberStatus } from 'generated/prisma/enums';
import { PrismaService } from '../../database/prisma.service';
import {
  JwtAccessPayload,
  MemberContext,
  OrganizationContext,
} from '../interfaces';

const liveMemberAccessInclude = {
  organization: {
    include: {
      modules: {
        where: { isEnabled: true },
        include: {
          module: true,
        },
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
    orderBy: {
      role: {
        key: 'asc',
      },
    },
  },
} satisfies Prisma.OrganizationMemberInclude;

type LiveMemberAccessRecord = Prisma.OrganizationMemberGetPayload<{
  include: typeof liveMemberAccessInclude;
}>;

export type LiveAccessContext = {
  organization?: OrganizationContext;
  member?: MemberContext;
};

export async function resolveLiveAccessContext(
  prisma: PrismaService,
  payload: JwtAccessPayload,
): Promise<LiveAccessContext> {
  if (!payload.organizationId || !payload.memberId) {
    return {};
  }

  const membership = await prisma.organizationMember.findFirst({
    where: {
      id: payload.memberId,
      organizationId: payload.organizationId,
      userId: payload.sub,
      status: MemberStatus.ACTIVE,
      deletedAt: null,
    },
    include: liveMemberAccessInclude,
  });

  if (!membership) {
    return {};
  }

  return mapLiveAccessContext(membership);
}

function mapLiveAccessContext(
  membership: LiveMemberAccessRecord,
): LiveAccessContext {
  const roles = membership.roles.map((memberRole) => memberRole.role.key);
  const permissions = [
    ...new Set(
      membership.roles.flatMap((memberRole) =>
        memberRole.role.permissions.map(
          (rolePermission) => rolePermission.permission.key,
        ),
      ),
    ),
  ];
  const enabledModules = membership.organization.modules.map(
    (organizationModule) => organizationModule.module.key,
  );

  return {
    organization: {
      id: membership.organization.id,
      slug: membership.organization.slug,
      name: membership.organization.name,
      timezone: membership.organization.timezone,
      locale: membership.organization.locale,
      defaultCurrency: membership.organization.defaultCurrency,
    },
    member: {
      id: membership.id,
      organizationId: membership.organizationId,
      userId: membership.userId,
      roles,
      permissions,
      enabledModules,
    },
  };
}
