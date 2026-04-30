import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description:
      'Optional refresh token body fallback. Browser clients should prefer the httpOnly cookie.',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiPropertyOptional({
    example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a',
    description:
      'Optional tenant selector fallback. When omitted, the server reuses the tenant embedded in the refresh session.',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({
    example: 'agoge-academy',
    description:
      'Optional tenant slug fallback. Useful for non-browser clients that rotate sessions outside the current UI context.',
  })
  @IsOptional()
  @IsString()
  organizationSlug?: string;
}
