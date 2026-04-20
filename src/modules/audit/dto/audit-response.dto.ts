import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditActorUserResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ example: 'admin@agoge.com' })
  email: string;

  @ApiPropertyOptional({ example: 'admin' })
  username?: string | null;

  @ApiProperty({ example: 'Alex' })
  firstName: string;

  @ApiProperty({ example: 'Admin' })
  lastName: string;
}

export class AuditActorMemberResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ type: AuditActorUserResponseDto })
  user: AuditActorUserResponseDto;
}

export class AuditLogResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ example: 'settings.organization.updated' })
  action: string;

  @ApiProperty({ example: 'organization' })
  entityType: string;

  @ApiPropertyOptional({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  entityId?: string | null;

  @ApiPropertyOptional({ type: AuditActorUserResponseDto })
  actorUser?: AuditActorUserResponseDto | null;

  @ApiPropertyOptional({ type: AuditActorMemberResponseDto })
  actorMember?: AuditActorMemberResponseDto | null;

  @ApiPropertyOptional({ example: { name: 'Old Name' } })
  before?: unknown;

  @ApiPropertyOptional({ example: { name: 'New Name' } })
  after?: unknown;

  @ApiPropertyOptional({ example: { requestId: 'req-id' } })
  metadata?: unknown;

  @ApiPropertyOptional({ example: '127.0.0.1' })
  ipAddress?: string | null;

  @ApiPropertyOptional({ example: 'Mozilla/5.0' })
  userAgent?: string | null;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  createdAt: Date;
}

export class AuditDimensionCountDto {
  @ApiProperty({ example: 'settings.organization.updated' })
  key: string;

  @ApiProperty({ example: 10 })
  count: number;
}

export class AuditSummaryResponseDto {
  @ApiProperty({ example: 120 })
  totalEvents: number;

  @ApiProperty({ type: [AuditDimensionCountDto] })
  byAction: AuditDimensionCountDto[];

  @ApiProperty({ type: [AuditDimensionCountDto] })
  byEntityType: AuditDimensionCountDto[];

  @ApiProperty({ type: [AuditLogResponseDto] })
  recentEvents: AuditLogResponseDto[];
}

export class AuditCatalogResponseDto {
  @ApiProperty({ example: ['settings.organization.updated'] })
  actions: string[];

  @ApiProperty({ example: ['organization'] })
  entityTypes: string[];
}
