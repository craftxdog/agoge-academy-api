import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
  Length,
  Matches,
} from 'class-validator';

export class RegisterOrganizationDto {
  @ApiProperty({ example: 'Agoge Academy' })
  @IsString()
  @Length(2, 120)
  organizationName!: string;

  @ApiPropertyOptional({
    example: 'agoge-academy',
    description:
      'URL-safe tenant slug. When omitted, it is generated from organizationName.',
  })
  @IsOptional()
  @IsString()
  @Length(3, 80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  organizationSlug?: string;

  @ApiPropertyOptional({ example: 'America/Managua' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 'es-NI' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiProperty({ example: 'founder@agoge.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: 'founder' })
  @IsOptional()
  @IsString()
  @Length(3, 50)
  username?: string;

  @ApiProperty({ example: 'Alex' })
  @IsString()
  @Length(1, 80)
  firstName!: string;

  @ApiProperty({ example: 'Founder' })
  @IsString()
  @Length(1, 80)
  lastName!: string;

  @ApiProperty({
    example: 'SaaS-ready-password-2026!',
    minLength: 12,
  })
  @IsStrongPassword({
    minLength: 12,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password!: string;

  @ApiPropertyOptional({ example: '+50588889999' })
  @IsOptional()
  @IsString()
  @Length(7, 20)
  phone?: string;

  @ApiPropertyOptional({ example: '001-010190-0001A' })
  @IsOptional()
  @IsString()
  @Length(3, 30)
  documentId?: string;
}
