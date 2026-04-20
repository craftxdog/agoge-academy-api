import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RbacModuleSummaryDto {
  @ApiProperty({ example: 'settings' })
  key: string;

  @ApiProperty({ example: 'Settings' })
  name: string;

  @ApiPropertyOptional({
    example: 'Company settings, branding, modules and permissions.',
  })
  description?: string | null;
}

export class RbacPermissionResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ example: 'users.read' })
  key: string;

  @ApiProperty({ example: 'Read users' })
  name: string;

  @ApiPropertyOptional({ example: 'View members and invitations.' })
  description?: string | null;

  @ApiPropertyOptional({ type: RbacModuleSummaryDto })
  module?: RbacModuleSummaryDto | null;
}

export class RbacRoleResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ example: 'front-desk' })
  key: string;

  @ApiProperty({ example: 'Front Desk' })
  name: string;

  @ApiPropertyOptional({
    example: 'Can manage member check-ins and basic user information.',
  })
  description?: string | null;

  @ApiProperty({ example: false })
  isSystem: boolean;

  @ApiProperty({ example: false })
  isDefault: boolean;

  @ApiProperty({ type: [RbacPermissionResponseDto] })
  permissions: RbacPermissionResponseDto[];

  @ApiProperty({
    description: 'Number of organization members currently assigned.',
    example: 3,
  })
  memberCount: number;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  updatedAt: Date;
}

export class RbacMemberRoleResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  memberId: string;

  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  organizationId: string;

  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  userId: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ type: [RbacRoleResponseDto] })
  roles: RbacRoleResponseDto[];
}

export class RbacScreenResponseDto {
  @ApiProperty({ example: 'settings.roles' })
  key: string;

  @ApiProperty({ example: 'Roles and Permissions' })
  title: string;

  @ApiPropertyOptional({ example: '/settings/roles' })
  path?: string | null;

  @ApiProperty({ example: 'SYSTEM' })
  type: string;

  @ApiPropertyOptional({ example: 'roles.manage' })
  requiredPermissionKey?: string | null;

  @ApiProperty({ example: true })
  isVisible: boolean;
}

export class RbacAccessModuleResponseDto {
  @ApiProperty({ example: 'settings' })
  key: string;

  @ApiProperty({ example: 'Settings' })
  name: string;

  @ApiProperty({ example: true })
  isEnabled: boolean;

  @ApiProperty({ type: [RbacPermissionResponseDto] })
  permissions: RbacPermissionResponseDto[];

  @ApiProperty({ type: [RbacScreenResponseDto] })
  screens: RbacScreenResponseDto[];
}

export class RbacAccessMatrixResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  organizationId: string;

  @ApiProperty({ type: [RbacAccessModuleResponseDto] })
  modules: RbacAccessModuleResponseDto[];

  @ApiProperty({ type: [RbacRoleResponseDto] })
  roles: RbacRoleResponseDto[];
}
