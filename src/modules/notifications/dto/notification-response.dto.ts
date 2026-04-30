import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from 'generated/prisma/enums';

export class CursorPaginationMetaDto {
  @ApiProperty({ example: 'cursor' })
  strategy: 'cursor';

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 20 })
  count: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;

  @ApiPropertyOptional({ example: 'eyJpZCI6Im5vdGlmLTIifQ' })
  nextCursor: string | null;

  @ApiPropertyOptional({ example: 'eyJpZCI6Im5vdGlmLTEifQ' })
  previousCursor: string | null;

  @ApiProperty({ example: 'createdAt' })
  sortBy: string;

  @ApiProperty({ example: 'desc' })
  sortDirection: 'asc' | 'desc';
}

export class NotificationResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ enum: NotificationType, example: 'PAYMENT_CREATED' })
  type: NotificationType;

  @ApiProperty({ example: 'Payment created' })
  title: string;

  @ApiProperty({
    example: 'Invoice INV-202604-000001 was created for Alex Athlete.',
  })
  message: string;

  @ApiPropertyOptional({
    example: {
      sourceDomain: 'billing',
      sourceResource: 'payment',
      sourceAction: 'created',
      entityId: 'payment-id',
    },
  })
  data?: unknown;

  @ApiProperty({ example: false })
  isRead: boolean;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  updatedAt: Date;
}

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  items: NotificationResponseDto[];

  @ApiProperty({ type: CursorPaginationMetaDto })
  pagination: CursorPaginationMetaDto;
}

export class NotificationSummaryResponseDto {
  @ApiProperty({ example: 7 })
  unreadCount: number;

  @ApiPropertyOptional({ example: '2026-04-20T00:00:00.000Z' })
  latestCreatedAt: Date | null;

  @ApiProperty({ type: [NotificationResponseDto] })
  recent: NotificationResponseDto[];
}

export class NotificationReadResponseDto {
  @ApiProperty({ type: NotificationResponseDto })
  notification: NotificationResponseDto;

  @ApiProperty({ example: 6 })
  unreadCount: number;
}

export class NotificationReadAllResponseDto {
  @ApiProperty({ example: 12 })
  updatedCount: number;

  @ApiProperty({ example: 0 })
  unreadCount: number;
}
