import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { NotificationType } from 'generated/prisma/enums';
import { CursorPaginationQueryDto } from '../../../common';

export const NOTIFICATION_SORT_FIELDS = ['createdAt', 'updatedAt'] as const;
export type NotificationSortField = (typeof NOTIFICATION_SORT_FIELDS)[number];

export class NotificationQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ example: 'payment' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: NOTIFICATION_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(NOTIFICATION_SORT_FIELDS)
  override sortBy: NotificationSortField = 'createdAt';
}
