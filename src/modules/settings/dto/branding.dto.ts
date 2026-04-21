import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

export class UpdateOrganizationBrandingDto {
  @ApiPropertyOptional({ example: 'https://cdn.agoge.com/logo.png' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.agoge.com/icon.png' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  iconUrl?: string | null;

  @ApiPropertyOptional({ example: '#0F766E' })
  @IsOptional()
  @IsString()
  @Matches(HEX_COLOR_PATTERN)
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#2563EB' })
  @IsOptional()
  @IsString()
  @Matches(HEX_COLOR_PATTERN)
  secondaryColor?: string;

  @ApiPropertyOptional({ example: '#F59E0B' })
  @IsOptional()
  @IsString()
  @Matches(HEX_COLOR_PATTERN)
  accentColor?: string;

  @ApiPropertyOptional({
    description: 'Free-form UI theme tokens controlled by the tenant.',
    example: { mode: 'light', radius: 8 },
  })
  @IsOptional()
  @IsObject()
  theme?: Record<string, unknown>;
}
