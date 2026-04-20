import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResult, TenantRequest } from '../../../common';
import {
  getCurrentMember,
  getCurrentOrganization,
  getCurrentUser,
  getRequestId,
} from '../../../common/utils/request-context.util';
import {
  AuditActorQueryDto,
  AuditCatalogResponseDto,
  AuditEntityQueryDto,
  AuditLogQueryDto,
  AuditLogResponseDto,
  AuditSummaryQueryDto,
  AuditSummaryResponseDto,
} from '../dto';
import { AuditLogRecord, AuditRepository } from '../repositories';

export type RecordAuditLogParams = {
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
};

export type RecordAuditLogFromRequestParams = Omit<
  RecordAuditLogParams,
  'organizationId' | 'actorUserId' | 'actorMemberId' | 'ipAddress' | 'userAgent'
> & {
  organizationId?: string;
};

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async listLogs(
    organizationId: string,
    query: AuditLogQueryDto,
  ): Promise<PaginatedResult<AuditLogResponseDto>> {
    this.assertDateRange(query);
    const page = await this.auditRepository.findAuditLogsPage(
      organizationId,
      query,
    );

    return {
      ...page,
      items: page.items.map((log) => this.mapLog(log)),
      message: 'Audit logs retrieved successfully',
    };
  }

  async getLog(
    organizationId: string,
    auditLogId: string,
  ): Promise<AuditLogResponseDto> {
    const log = await this.auditRepository.findAuditLogById(
      organizationId,
      auditLogId,
    );

    if (!log) {
      throw new NotFoundException('Audit log was not found in this tenant');
    }

    return this.mapLog(log);
  }

  async listEntityLogs(
    organizationId: string,
    entityType: string,
    entityId: string,
    query: AuditEntityQueryDto,
  ): Promise<PaginatedResult<AuditLogResponseDto>> {
    this.assertDateRange(query);
    const page = await this.auditRepository.findEntityLogsPage({
      organizationId,
      entityType,
      entityId,
      query,
    });

    return {
      ...page,
      items: page.items.map((log) => this.mapLog(log)),
      message: 'Entity audit logs retrieved successfully',
    };
  }

  async listActorUserLogs(
    organizationId: string,
    actorUserId: string,
    query: AuditActorQueryDto,
  ): Promise<PaginatedResult<AuditLogResponseDto>> {
    this.assertDateRange(query);
    const page = await this.auditRepository.findActorUserLogsPage({
      organizationId,
      actorUserId,
      query,
    });

    return {
      ...page,
      items: page.items.map((log) => this.mapLog(log)),
      message: 'Actor user audit logs retrieved successfully',
    };
  }

  async listActorMemberLogs(
    organizationId: string,
    actorMemberId: string,
    query: AuditActorQueryDto,
  ): Promise<PaginatedResult<AuditLogResponseDto>> {
    this.assertDateRange(query);
    const page = await this.auditRepository.findActorMemberLogsPage({
      organizationId,
      actorMemberId,
      query,
    });

    return {
      ...page,
      items: page.items.map((log) => this.mapLog(log)),
      message: 'Actor member audit logs retrieved successfully',
    };
  }

  async getSummary(
    organizationId: string,
    query: AuditSummaryQueryDto,
  ): Promise<AuditSummaryResponseDto> {
    this.assertDateRange(query);
    const [totalEvents, byAction, byEntityType, recentEvents] =
      await Promise.all([
        this.auditRepository.countLogs(organizationId, query),
        this.auditRepository.countByAction(organizationId, query),
        this.auditRepository.countByEntityType(organizationId, query),
        this.auditRepository.findRecentLogs(organizationId, query),
      ]);

    return {
      totalEvents,
      byAction,
      byEntityType,
      recentEvents: recentEvents.map((log) => this.mapLog(log)),
    };
  }

  getCatalog(organizationId: string): Promise<AuditCatalogResponseDto> {
    return this.auditRepository.findCatalog(organizationId);
  }

  async record(params: RecordAuditLogParams): Promise<AuditLogResponseDto> {
    const log = await this.auditRepository.createAuditLog({
      ...params,
      action: this.normalizeKey(params.action, 'action'),
      entityType: this.normalizeKey(params.entityType, 'entityType'),
      entityId: params.entityId?.trim(),
    });

    return this.mapLog(log);
  }

  async recordFromRequest(
    request: TenantRequest,
    params: RecordAuditLogFromRequestParams,
  ): Promise<AuditLogResponseDto> {
    const organizationId =
      params.organizationId ?? getCurrentOrganization(request)?.id;

    if (!organizationId) {
      throw new BadRequestException(
        'organizationId is required to record audit logs',
      );
    }

    const user = getCurrentUser(request);
    const member = getCurrentMember(request);
    const requestId = getRequestId(request);
    const metadata = {
      ...params.metadata,
      ...(requestId && { requestId }),
    };

    return this.record({
      ...params,
      organizationId,
      actorUserId: user?.id,
      actorMemberId: member?.id,
      metadata,
      ipAddress: this.getIpAddress(request),
      userAgent: this.getUserAgent(request),
    });
  }

  private assertDateRange(query: { dateFrom?: string; dateTo?: string }): void {
    if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo) {
      throw new BadRequestException('dateFrom must be before or equal dateTo');
    }
  }

  private normalizeKey(value: string, field: string): string {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      throw new BadRequestException(`${field} is required`);
    }

    return normalized;
  }

  private getIpAddress(request: TenantRequest): string | null {
    const forwardedFor = request.headers['x-forwarded-for'];
    const value = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;

    return value?.split(',')[0]?.trim() ?? request.ip ?? null;
  }

  private getUserAgent(request: TenantRequest): string | null {
    const value = request.headers['user-agent'];

    return (Array.isArray(value) ? value[0] : value) ?? null;
  }

  private mapLog(log: AuditLogRecord): AuditLogResponseDto {
    return {
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      actorUser: log.actorUser
        ? {
            id: log.actorUser.id,
            email: log.actorUser.email,
            username: log.actorUser.username,
            firstName: log.actorUser.firstName,
            lastName: log.actorUser.lastName,
          }
        : null,
      actorMember: log.actorMember
        ? {
            id: log.actorMember.id,
            user: {
              id: log.actorMember.user.id,
              email: log.actorMember.user.email,
              username: log.actorMember.user.username,
              firstName: log.actorMember.user.firstName,
              lastName: log.actorMember.user.lastName,
            },
          }
        : null,
      before: log.before,
      after: log.after,
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    };
  }
}
