import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import {
  buildCursorPagination,
  getCursorId,
  PaginatedResult,
} from '../../../common';
import { PrismaService } from '../../../database/prisma.service';
import {
  AuditActorQueryDto,
  AuditEntityQueryDto,
  AuditLogQueryDto,
  AuditSummaryQueryDto,
} from '../dto';

const auditInclude = {
  actorUser: true,
  actorMember: {
    include: {
      user: true,
    },
  },
} satisfies Prisma.AuditLogInclude;

export type AuditLogRecord = Prisma.AuditLogGetPayload<{
  include: typeof auditInclude;
}>;

export type AuditDimensionCount = {
  key: string;
  count: number;
};

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAuditLogsPage(
    organizationId: string,
    query: AuditLogQueryDto,
  ): Promise<PaginatedResult<AuditLogRecord>> {
    const cursorId = getCursorId(query.cursor);
    const where = this.buildAuditWhere(organizationId, query);
    const records = await this.prisma.auditLog.findMany({
      where,
      include: auditInclude,
      take: query.limit + 1,
      ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
      orderBy: [
        {
          [query.sortBy]: query.sortDirection,
        } as Prisma.AuditLogOrderByWithRelationInput,
        { id: query.sortDirection },
      ],
    });

    return buildCursorPagination(records, query);
  }

  findAuditLogById(
    organizationId: string,
    auditLogId: string,
  ): Promise<AuditLogRecord | null> {
    return this.prisma.auditLog.findFirst({
      where: { id: auditLogId, organizationId },
      include: auditInclude,
    });
  }

  async findEntityLogsPage(params: {
    organizationId: string;
    entityType: string;
    entityId: string;
    query: AuditEntityQueryDto;
  }): Promise<PaginatedResult<AuditLogRecord>> {
    const cursorId = getCursorId(params.query.cursor);
    const where: Prisma.AuditLogWhereInput = {
      organizationId: params.organizationId,
      entityType: params.entityType,
      entityId: params.entityId,
      ...(params.query.action && { action: params.query.action }),
      ...this.buildDateRange(params.query),
    };
    const records = await this.prisma.auditLog.findMany({
      where,
      include: auditInclude,
      take: params.query.limit + 1,
      ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
      orderBy: [{ createdAt: params.query.sortDirection }, { id: 'desc' }],
    });

    return buildCursorPagination(records, params.query);
  }

  async findActorUserLogsPage(params: {
    organizationId: string;
    actorUserId: string;
    query: AuditActorQueryDto;
  }): Promise<PaginatedResult<AuditLogRecord>> {
    return this.findActorLogsPage({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      query: params.query,
    });
  }

  async findActorMemberLogsPage(params: {
    organizationId: string;
    actorMemberId: string;
    query: AuditActorQueryDto;
  }): Promise<PaginatedResult<AuditLogRecord>> {
    return this.findActorLogsPage({
      organizationId: params.organizationId,
      actorMemberId: params.actorMemberId,
      query: params.query,
    });
  }

  async countLogs(
    organizationId: string,
    query: AuditSummaryQueryDto,
  ): Promise<number> {
    return this.prisma.auditLog.count({
      where: {
        organizationId,
        ...this.buildDateRange(query),
      },
    });
  }

  async countByAction(
    organizationId: string,
    query: AuditSummaryQueryDto,
  ): Promise<AuditDimensionCount[]> {
    const rows = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        organizationId,
        ...this.buildDateRange(query),
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
      take: 10,
    });

    return rows.map((row) => ({
      key: row.action,
      count: row._count._all,
    }));
  }

  async countByEntityType(
    organizationId: string,
    query: AuditSummaryQueryDto,
  ): Promise<AuditDimensionCount[]> {
    const rows = await this.prisma.auditLog.groupBy({
      by: ['entityType'],
      where: {
        organizationId,
        ...this.buildDateRange(query),
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          entityType: 'desc',
        },
      },
      take: 10,
    });

    return rows.map((row) => ({
      key: row.entityType,
      count: row._count._all,
    }));
  }

  findRecentLogs(
    organizationId: string,
    query: AuditSummaryQueryDto,
    take = 10,
  ): Promise<AuditLogRecord[]> {
    return this.prisma.auditLog.findMany({
      where: {
        organizationId,
        ...this.buildDateRange(query),
      },
      include: auditInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
    });
  }

  async findCatalog(organizationId: string): Promise<{
    actions: string[];
    entityTypes: string[];
  }> {
    const [actions, entityTypes] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { organizationId },
        select: { action: true },
        distinct: ['action'],
        orderBy: { action: 'asc' },
      }),
      this.prisma.auditLog.findMany({
        where: { organizationId },
        select: { entityType: true },
        distinct: ['entityType'],
        orderBy: { entityType: 'asc' },
      }),
    ]);

    return {
      actions: actions.map((row) => row.action),
      entityTypes: entityTypes.map((row) => row.entityType),
    };
  }

  createAuditLog(params: {
    organizationId: string;
    actorUserId?: string | null;
    actorMemberId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<AuditLogRecord> {
    return this.prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        actorUserId: params.actorUserId,
        actorMemberId: params.actorMemberId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        before: params.before as Prisma.InputJsonValue | undefined,
        after: params.after as Prisma.InputJsonValue | undefined,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
      include: auditInclude,
    });
  }

  private async findActorLogsPage(params: {
    organizationId: string;
    actorUserId?: string;
    actorMemberId?: string;
    query: AuditActorQueryDto;
  }): Promise<PaginatedResult<AuditLogRecord>> {
    const cursorId = getCursorId(params.query.cursor);
    const where: Prisma.AuditLogWhereInput = {
      organizationId: params.organizationId,
      ...(params.actorUserId && { actorUserId: params.actorUserId }),
      ...(params.actorMemberId && { actorMemberId: params.actorMemberId }),
      ...(params.query.action && { action: params.query.action }),
      ...this.buildDateRange(params.query),
    };
    const records = await this.prisma.auditLog.findMany({
      where,
      include: auditInclude,
      take: params.query.limit + 1,
      ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
      orderBy: [{ createdAt: params.query.sortDirection }, { id: 'desc' }],
    });

    return buildCursorPagination(records, params.query);
  }

  private buildAuditWhere(
    organizationId: string,
    query: AuditLogQueryDto,
  ): Prisma.AuditLogWhereInput {
    return {
      organizationId,
      ...(query.action && { action: query.action }),
      ...(query.entityType && { entityType: query.entityType }),
      ...(query.entityId && { entityId: query.entityId }),
      ...(query.actorUserId && { actorUserId: query.actorUserId }),
      ...(query.actorMemberId && { actorMemberId: query.actorMemberId }),
      ...this.buildDateRange(query),
      ...(query.search && {
        OR: [
          { action: { contains: query.search, mode: 'insensitive' } },
          { entityType: { contains: query.search, mode: 'insensitive' } },
          { entityId: { contains: query.search, mode: 'insensitive' } },
          { ipAddress: { contains: query.search, mode: 'insensitive' } },
          { userAgent: { contains: query.search, mode: 'insensitive' } },
          {
            actorUser: {
              email: { contains: query.search, mode: 'insensitive' },
            },
          },
          {
            actorMember: {
              user: {
                email: { contains: query.search, mode: 'insensitive' },
              },
            },
          },
        ],
      }),
    };
  }

  private buildDateRange(query: {
    dateFrom?: string;
    dateTo?: string;
  }): Prisma.AuditLogWhereInput {
    return {
      ...((query.dateFrom || query.dateTo) && {
        createdAt: {
          ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
          ...(query.dateTo && { lte: new Date(query.dateTo) }),
        },
      }),
    };
  }
}
