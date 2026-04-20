import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CursorPaginationQueryDto } from '../../../common';

export const AUDIT_SORT_FIELDS = ['createdAt', 'action', 'entityType'] as const;
export type AuditSortField = (typeof AUDIT_SORT_FIELDS)[number];

export class AuditLogQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ example: 'users.member.created' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  action?: string;

  @ApiPropertyOptional({ example: 'organization_member' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  entityType?: string;

  @ApiPropertyOptional({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  entityId?: string;

  @ApiPropertyOptional({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  @IsOptional()
  @IsString()
  actorUserId?: string;

  @ApiPropertyOptional({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  @IsOptional()
  @IsString()
  actorMemberId?: string;

  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-04-30T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description:
      'Searches action, entity type, entity id, actor email, IP address and user agent.',
    example: 'settings',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: AUDIT_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(AUDIT_SORT_FIELDS)
  override sortBy: AuditSortField = 'createdAt';
}

export class AuditEntityQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ example: 'users.member.updated' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  action?: string;

  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-04-30T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  override sortBy: AuditSortField = 'createdAt';
}

export class AuditActorQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ example: 'settings.organization.updated' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  action?: string;

  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-04-30T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  override sortBy: AuditSortField = 'createdAt';
}

export class AuditSummaryQueryDto {
  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-04-30T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
