import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrganizationBrandingResponseDto {
  @ApiPropertyOptional({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id?: string;

  @ApiPropertyOptional({ example: 'https://cdn.agoge.com/logo.png' })
  logoUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.agoge.com/icon.png' })
  iconUrl?: string | null;

  @ApiPropertyOptional({ example: '#0F766E' })
  primaryColor?: string | null;

  @ApiPropertyOptional({ example: '#2563EB' })
  secondaryColor?: string | null;

  @ApiPropertyOptional({ example: '#F59E0B' })
  accentColor?: string | null;

  @ApiPropertyOptional({ example: { mode: 'light', radius: 8 } })
  theme?: unknown;
}

export class OrganizationProfileResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ example: 'agoge-academy' })
  slug: string;

  @ApiProperty({ example: 'Agoge Academy' })
  name: string;

  @ApiPropertyOptional({ example: 'Agoge Academy S.A.' })
  legalName?: string | null;

  @ApiPropertyOptional({ example: 'J0310000000000' })
  taxId?: string | null;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: 'America/Managua' })
  timezone: string;

  @ApiProperty({ example: 'es-NI' })
  locale: string;

  @ApiProperty({ example: 'NIO' })
  defaultCurrency: string;

  @ApiPropertyOptional({ type: OrganizationBrandingResponseDto })
  branding?: OrganizationBrandingResponseDto | null;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  updatedAt: Date;
}

export class OrganizationSettingResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ example: 'billing' })
  namespace: string;

  @ApiProperty({ example: 'currency' })
  key: string;

  @ApiProperty({ example: 'NIO' })
  value: unknown;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  updatedAt: Date;
}

export class AppModuleSummaryDto {
  @ApiProperty({ example: 'settings' })
  key: string;

  @ApiProperty({ example: 'Settings' })
  name: string;

  @ApiPropertyOptional({ example: 'Company settings and permissions.' })
  description?: string | null;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;
}

export class OrganizationModuleResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ type: AppModuleSummaryDto })
  module: AppModuleSummaryDto;

  @ApiProperty({ example: true })
  isEnabled: boolean;

  @ApiPropertyOptional({ example: { allowSelfService: true } })
  config?: unknown;

  @ApiProperty({ example: 10 })
  sortOrder: number;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  updatedAt: Date;
}

export class OrganizationScreenResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ example: 'settings.roles' })
  key: string;

  @ApiProperty({ example: 'Roles and Permissions' })
  title: string;

  @ApiPropertyOptional({ example: '/settings/roles' })
  path?: string | null;

  @ApiProperty({ example: 'SYSTEM' })
  type: string;

  @ApiPropertyOptional({ example: 'settings' })
  moduleKey?: string | null;

  @ApiPropertyOptional({ example: 'roles.manage' })
  requiredPermissionKey?: string | null;

  @ApiPropertyOptional({ example: { icon: 'shield' } })
  config?: unknown;

  @ApiProperty({ example: 10 })
  sortOrder: number;

  @ApiProperty({ example: true })
  isVisible: boolean;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  updatedAt: Date;
}
