import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserAccountResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ example: 'coach@agoge.com' })
  email: string;

  @ApiPropertyOptional({ example: 'coach.alex' })
  username?: string | null;

  @ApiProperty({ example: 'Alex' })
  firstName: string;

  @ApiProperty({ example: 'Coach' })
  lastName: string;

  @ApiProperty({ example: 'USER' })
  platformRole: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;
}

export class MemberRoleSummaryDto {
  @ApiProperty({ example: 'admin' })
  key: string;

  @ApiProperty({ example: 'Admin' })
  name: string;

  @ApiProperty({ example: true })
  isSystem: boolean;
}

export class MemberResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  organizationId: string;

  @ApiProperty({ type: UserAccountResponseDto })
  user: UserAccountResponseDto;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiPropertyOptional({ example: '+50588889999' })
  phone?: string | null;

  @ApiPropertyOptional({ example: '001-010190-0001A' })
  documentId?: string | null;

  @ApiPropertyOptional({ example: 'Managua, Nicaragua' })
  address?: string | null;

  @ApiPropertyOptional({ example: '2026-04-20T00:00:00.000Z' })
  joinedAt?: Date | null;

  @ApiProperty({ type: [MemberRoleSummaryDto] })
  roles: MemberRoleSummaryDto[];

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  updatedAt: Date;
}

export class InvitationResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  organizationId: string;

  @ApiProperty({ example: 'coach@agoge.com' })
  email: string;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiPropertyOptional({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  invitedByMemberId?: string | null;

  @ApiProperty({ example: '2026-04-27T00:00:00.000Z' })
  expiresAt: Date;

  @ApiPropertyOptional({ example: '2026-04-20T00:00:00.000Z' })
  acceptedAt?: Date | null;

  @ApiPropertyOptional({ example: '2026-04-20T00:00:00.000Z' })
  revokedAt?: Date | null;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  updatedAt: Date;
}

export class CreatedInvitationResponseDto extends InvitationResponseDto {
  @ApiProperty({
    description:
      'Raw invitation token. It is returned once so the caller can deliver it through email or another secure channel.',
    example: 'lq2QJ2h5L8v9wT...',
  })
  token: string;
}

export class AcceptInvitationResponseDto {
  @ApiProperty({ type: MemberResponseDto })
  member: MemberResponseDto;

  @ApiProperty({ type: InvitationResponseDto })
  invitation: InvitationResponseDto;
}
