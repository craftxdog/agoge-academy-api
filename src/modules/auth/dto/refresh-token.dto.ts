import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description:
      'Optional refresh token body fallback. Browser clients should prefer the httpOnly cookie.',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
