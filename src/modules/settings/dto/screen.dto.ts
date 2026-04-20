import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { ScreenType } from 'generated/prisma/enums';

const CUSTOM_SCREEN_TYPES = [
  ScreenType.CUSTOM_PAGE,
  ScreenType.EXTERNAL_LINK,
  ScreenType.FORM,
  ScreenType.EMBED,
] as const;

export class CreateOrganizationScreenDto {
  @ApiProperty({
    description: 'Tenant-scoped screen key.',
    example: 'custom.reports',
  })
  @IsString()
  @Length(2, 120)
  @Matches(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/)
  key: string;

  @ApiProperty({ example: 'Reports' })
  @IsString()
  @Length(2, 160)
  title: string;

  @ApiPropertyOptional({ example: '/reports' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  path?: string;

  @ApiProperty({
    enum: CUSTOM_SCREEN_TYPES,
    example: ScreenType.CUSTOM_PAGE,
  })
  @IsEnum(ScreenType)
  type: ScreenType;

  @ApiPropertyOptional({
    description: 'Attach the custom screen to an existing module key.',
    example: 'settings',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  moduleKey?: string;

  @ApiPropertyOptional({ example: 'settings.read' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  requiredPermissionKey?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({
    description: 'Screen-specific configuration or embedded metadata.',
    example: { icon: 'chart' },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class UpdateOrganizationScreenDto {
  @ApiPropertyOptional({ example: 'Reports' })
  @IsOptional()
  @IsString()
  @Length(2, 160)
  title?: string;

  @ApiPropertyOptional({ example: '/reports' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  path?: string;

  @ApiPropertyOptional({
    enum: Object.values(ScreenType),
    example: ScreenType.CUSTOM_PAGE,
  })
  @IsOptional()
  @IsEnum(ScreenType)
  type?: ScreenType;

  @ApiPropertyOptional({ example: 'settings.read' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  requiredPermissionKey?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ example: { icon: 'chart' } })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
