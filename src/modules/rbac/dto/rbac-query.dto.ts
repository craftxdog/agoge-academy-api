import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { CursorPaginationQueryDto } from '../../../common';

export const RBAC_ROLE_SORT_FIELDS = ['createdAt', 'name', 'key'] as const;
export type RbacRoleSortField = (typeof RBAC_ROLE_SORT_FIELDS)[number];

export class RbacRoleQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search roles by key, name or description.',
    example: 'coach',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: RBAC_ROLE_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(RBAC_ROLE_SORT_FIELDS)
  override sortBy: RbacRoleSortField = 'createdAt';
}

export class RbacPermissionQueryDto {
  @ApiPropertyOptional({
    description: 'Filter permissions by module key.',
    example: 'settings',
  })
  @IsOptional()
  @IsString()
  moduleKey?: string;
}
