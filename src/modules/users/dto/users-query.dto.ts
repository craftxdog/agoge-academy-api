import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { MemberStatus, InvitationStatus } from 'generated/prisma/enums';
import { CursorPaginationQueryDto } from '../../../common';

export const USER_MEMBER_SORT_FIELDS = [
  'createdAt',
  'joinedAt',
  'status',
] as const;
export type UserMemberSortField = (typeof USER_MEMBER_SORT_FIELDS)[number];

export class MemberQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Search by email, first name, last name, phone or document id.',
    example: 'alex',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: MemberStatus })
  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @ApiPropertyOptional({
    enum: USER_MEMBER_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(USER_MEMBER_SORT_FIELDS)
  override sortBy: UserMemberSortField = 'createdAt';
}

export class InvitationQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ enum: InvitationStatus })
  @IsOptional()
  @IsEnum(InvitationStatus)
  status?: InvitationStatus;

  @ApiPropertyOptional({
    description: 'Search invitation by email.',
    example: 'coach@agoge.com',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
