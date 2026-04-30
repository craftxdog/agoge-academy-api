import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { NotificationType } from 'generated/prisma/enums';
import { PaginatedResult } from '../../../common';
import { buildCursorPagination, getCursorId } from '../../../common/utils';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationQueryDto } from '../dto';

const notificationSelect = {
  id: true,
  organizationId: true,
  type: true,
  title: true,
  message: true,
  data: true,
  isRead: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NotificationSelect;

export type NotificationRecord = Prisma.NotificationGetPayload<{
  select: typeof notificationSelect;
}>;

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findNotificationsPage(
    organizationId: string,
    query: NotificationQueryDto,
  ): Promise<PaginatedResult<NotificationRecord>> {
    const cursorId = getCursorId(query.cursor);
    const where: Prisma.NotificationWhereInput = {
      organizationId,
      ...(typeof query.isRead === 'boolean' && { isRead: query.isRead }),
      ...(query.type && { type: query.type }),
      ...(query.search && {
        OR: [
          {
            title: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            message: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
        ],
      }),
    };

    const records = await this.prisma.notification.findMany({
      where,
      select: notificationSelect,
      take: query.limit + 1,
      ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
      orderBy: [
        {
          [query.sortBy]: query.sortDirection,
        } as Prisma.NotificationOrderByWithRelationInput,
        { id: query.sortDirection },
      ],
    });

    return buildCursorPagination(records, query);
  }

  findNotificationById(
    organizationId: string,
    notificationId: string,
  ): Promise<NotificationRecord | null> {
    return this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        organizationId,
      },
      select: notificationSelect,
    });
  }

  createNotification(params: {
    organizationId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Prisma.InputJsonValue;
  }): Promise<NotificationRecord> {
    return this.prisma.notification.create({
      data: {
        organizationId: params.organizationId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data,
      },
      select: notificationSelect,
    });
  }

  updateNotificationReadState(params: {
    organizationId: string;
    notificationId: string;
    isRead: boolean;
  }): Promise<NotificationRecord> {
    return this.prisma.notification.update({
      where: {
        id: params.notificationId,
      },
      data: {
        isRead: params.isRead,
      },
      select: notificationSelect,
    });
  }

  markAllAsRead(organizationId: string): Promise<{ count: number }> {
    return this.prisma.notification.updateMany({
      where: {
        organizationId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  countUnread(organizationId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        organizationId,
        isRead: false,
      },
    });
  }

  findRecent(
    organizationId: string,
    limit: number,
  ): Promise<NotificationRecord[]> {
    return this.prisma.notification.findMany({
      where: {
        organizationId,
      },
      select: notificationSelect,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }
}
