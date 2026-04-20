import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class OrganizationSettingInputDto {
  @ApiProperty({
    description: 'Logical settings namespace.',
    example: 'billing',
  })
  @IsString()
  @MaxLength(80)
  namespace: string;

  @ApiProperty({
    description: 'Stable key inside the namespace.',
    example: 'currency',
  })
  @IsString()
  @MaxLength(120)
  key: string;

  @ApiProperty({
    description: 'JSON value for this setting.',
    example: { value: 'NIO' },
  })
  value: unknown;
}

export class UpsertOrganizationSettingsDto {
  @ApiProperty({ type: [OrganizationSettingInputDto] })
  @IsArray()
  @ArrayMaxSize(100)
  settings: OrganizationSettingInputDto[];
}

export class OrganizationSettingsQueryDto {
  @ApiPropertyOptional({ example: 'billing' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  namespace?: string;
}

export class UpdateOrganizationModuleDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Module-specific tenant configuration.',
    example: { allowSelfService: true },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
