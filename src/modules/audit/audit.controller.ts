import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentOrganization,
  JwtAuthGuard,
  ModulesGuard,
  Permissions,
  PermissionsGuard,
  RequireModules,
  SYSTEM_MODULES,
  SYSTEM_PERMISSIONS,
  TenantGuard,
} from '../../common';
import {
  AuditActorQueryDto,
  AuditCatalogResponseDto,
  AuditEntityQueryDto,
  AuditLogQueryDto,
  AuditLogResponseDto,
  AuditSummaryQueryDto,
  AuditSummaryResponseDto,
} from './dto';
import { AuditService } from './services';

@ApiTags('Audit')
@ApiBearerAuth('JWT-auth')
@Controller('audit')
@UseGuards(JwtAuthGuard, TenantGuard, ModulesGuard, PermissionsGuard)
@RequireModules(SYSTEM_MODULES.audit)
@Permissions(SYSTEM_PERMISSIONS.auditRead)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get audit summary',
    description:
      'Returns total events, top actions, top entity types and recent activity for the active tenant.',
  })
  @ApiOkResponse({ type: AuditSummaryResponseDto })
  getSummary(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: AuditSummaryQueryDto,
  ) {
    return this.auditService.getSummary(organizationId, query);
  }

  @Get('catalog')
  @ApiOperation({
    summary: 'Get audit filter catalog',
    description:
      'Returns distinct actions and entity types available in the active tenant audit trail.',
  })
  @ApiOkResponse({ type: AuditCatalogResponseDto })
  getCatalog(@CurrentOrganization('id') organizationId: string) {
    return this.auditService.getCatalog(organizationId);
  }

  @Get('logs')
  @ApiOperation({
    summary: 'List audit logs',
    description:
      'Cursor-paginated tenant audit trail with filters by action, entity, actor, dates and search.',
  })
  @ApiOkResponse({ type: [AuditLogResponseDto] })
  listLogs(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: AuditLogQueryDto,
  ) {
    return this.auditService.listLogs(organizationId, query);
  }

  @Get('logs/:auditLogId')
  @ApiOperation({ summary: 'Get audit log detail' })
  @ApiParam({ name: 'auditLogId', format: 'uuid' })
  @ApiOkResponse({ type: AuditLogResponseDto })
  getLog(
    @CurrentOrganization('id') organizationId: string,
    @Param('auditLogId') auditLogId: string,
  ) {
    return this.auditService.getLog(organizationId, auditLogId);
  }

  @Get('entities/:entityType/:entityId')
  @ApiOperation({
    summary: 'List audit logs for one entity',
    description:
      'Returns the activity history for one entity, such as a role, member, payment, location or setting.',
  })
  @ApiParam({ name: 'entityType', example: 'organization_member' })
  @ApiParam({
    name: 'entityId',
    example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a',
  })
  @ApiOkResponse({ type: [AuditLogResponseDto] })
  listEntityLogs(
    @CurrentOrganization('id') organizationId: string,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query() query: AuditEntityQueryDto,
  ) {
    return this.auditService.listEntityLogs(
      organizationId,
      entityType,
      entityId,
      query,
    );
  }

  @Get('actors/users/:actorUserId')
  @ApiOperation({
    summary: 'List audit logs for one actor user',
    description:
      'Returns all tenant events performed by a platform user account.',
  })
  @ApiParam({ name: 'actorUserId', format: 'uuid' })
  @ApiOkResponse({ type: [AuditLogResponseDto] })
  listActorUserLogs(
    @CurrentOrganization('id') organizationId: string,
    @Param('actorUserId') actorUserId: string,
    @Query() query: AuditActorQueryDto,
  ) {
    return this.auditService.listActorUserLogs(
      organizationId,
      actorUserId,
      query,
    );
  }

  @Get('actors/members/:actorMemberId')
  @ApiOperation({
    summary: 'List audit logs for one tenant member',
    description:
      'Returns all tenant events performed by a member inside the active organization.',
  })
  @ApiParam({ name: 'actorMemberId', format: 'uuid' })
  @ApiOkResponse({ type: [AuditLogResponseDto] })
  listActorMemberLogs(
    @CurrentOrganization('id') organizationId: string,
    @Param('actorMemberId') actorMemberId: string,
    @Query() query: AuditActorQueryDto,
  ) {
    return this.auditService.listActorMemberLogs(
      organizationId,
      actorMemberId,
      query,
    );
  }
}
