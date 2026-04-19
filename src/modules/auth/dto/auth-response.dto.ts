import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlatformRole } from 'generated/prisma/enums';

export class AuthUserDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id!: string;

  @ApiProperty({ example: 'founder@agoge.com' })
  email!: string;

  @ApiPropertyOptional({ example: 'founder' })
  username?: string | null;

  @ApiProperty({ example: 'Alex' })
  firstName!: string;

  @ApiProperty({ example: 'Founder' })
  lastName!: string;

  @ApiProperty({ enum: PlatformRole, example: PlatformRole.USER })
  platformRole!: PlatformRole;
}

export class AuthOrganizationDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id!: string;

  @ApiProperty({ example: 'agoge-academy' })
  slug!: string;

  @ApiProperty({ example: 'Agoge Academy' })
  name!: string;

  @ApiProperty({ example: 'America/Managua' })
  timezone!: string;

  @ApiProperty({ example: 'es-NI' })
  locale!: string;

  @ApiProperty({ example: 'USD' })
  defaultCurrency!: string;
}

export class AuthMembershipDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id!: string;

  @ApiProperty({ type: AuthOrganizationDto })
  organization!: AuthOrganizationDto;

  @ApiProperty({ example: ['admin'] })
  roles!: string[];

  @ApiProperty({ example: ['settings.read', 'settings.write'] })
  permissions!: string[];

  @ApiProperty({ example: ['settings', 'users', 'billing'] })
  enabledModules!: string[];
}

export class AuthTokensDto {
  @ApiProperty({
    description: 'JWT access token for Authorization Bearer use.',
  })
  accessToken!: string;

  @ApiProperty({
    description:
      'JWT refresh token. Browser clients also receive it as an httpOnly cookie.',
  })
  refreshToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: 'Bearer';

  @ApiProperty({ example: 900 })
  expiresInSeconds!: number;
}

export class AuthSessionResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;

  @ApiPropertyOptional({ type: AuthMembershipDto })
  activeMembership?: AuthMembershipDto | null;

  @ApiProperty({ type: AuthMembershipDto, isArray: true })
  memberships!: AuthMembershipDto[];

  @ApiProperty({ type: AuthTokensDto })
  tokens!: AuthTokensDto;
}

export class MeResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;

  @ApiPropertyOptional({ type: AuthMembershipDto })
  activeMembership?: AuthMembershipDto | null;

  @ApiProperty({ type: AuthMembershipDto, isArray: true })
  memberships!: AuthMembershipDto[];
}
