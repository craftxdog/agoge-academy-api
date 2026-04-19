import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'founder@agoge.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SaaS-ready-password-2026!' })
  @IsString()
  password!: string;

  @ApiPropertyOptional({
    example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a',
    description: 'Optional organization id to open a tenant-scoped session.',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({
    example: 'agoge-academy',
    description: 'Optional organization slug to open a tenant-scoped session.',
  })
  @IsOptional()
  @IsString()
  organizationSlug?: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'Reserved for clients that want longer UI sessions. Token duration still follows server config.',
  })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
