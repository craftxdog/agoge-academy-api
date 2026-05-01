import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { NotificationType } from 'generated/prisma/enums';
import { PaginatedResult, SYSTEM_MODULES } from '../../../common';
import { RealtimeService } from '../../realtime';
import {
  NotificationQueryDto,
  NotificationReadAllResponseDto,
  NotificationReadResponseDto,
  NotificationResponseDto,
  NotificationSummaryResponseDto,
} from '../dto';
import { NotificationRecord, NotificationsRepository } from '../repositories';

const DEFAULT_NOTIFICATION_SUMMARY_LIMIT = 10;

type CreateDomainNotificationParams = {
  organizationId: string;
  sourceDomain: 'billing' | 'schedules';
  sourceResource: string;
  sourceAction: string;
  sourceEntityId?: string | null;
  memberId?: string | null;
  userId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  payload?: unknown;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly realtimeService: RealtimeService,
  ) {}

  listNotifications(
    organizationId: string,
    query: NotificationQueryDto,
  ): Promise<PaginatedResult<NotificationResponseDto>> {
    return this.notificationsRepository
      .findNotificationsPage(organizationId, query)
      .then((page) => ({
        ...page,
        items: page.items.map((item) => this.mapNotification(item)),
      }));
  }

  listActivity(
    organizationId: string,
    memberId: string,
    query: NotificationQueryDto,
  ): Promise<PaginatedResult<NotificationResponseDto>> {
    return this.notificationsRepository
      .findMemberNotificationsPage(organizationId, memberId, query)
      .then((page) => ({
        ...page,
        items: page.items.map((item) => this.mapNotification(item)),
      }));
  }

  async getSummary(
    organizationId: string,
  ): Promise<NotificationSummaryResponseDto> {
    const [unreadCount, recent] = await Promise.all([
      this.notificationsRepository.countUnread(organizationId),
      this.notificationsRepository.findRecent(
        organizationId,
        DEFAULT_NOTIFICATION_SUMMARY_LIMIT,
      ),
    ]);

    return {
      unreadCount,
      latestCreatedAt: recent[0]?.createdAt ?? null,
      recent: recent.map((item) => this.mapNotification(item)),
    };
  }

  async getActivitySummary(
    organizationId: string,
    memberId: string,
  ): Promise<NotificationSummaryResponseDto> {
    const [unreadCount, recent] = await Promise.all([
      this.notificationsRepository.countMemberUnread(organizationId, memberId),
      this.notificationsRepository.findMemberRecent(
        organizationId,
        memberId,
        DEFAULT_NOTIFICATION_SUMMARY_LIMIT,
      ),
    ]);

    return {
      unreadCount,
      latestCreatedAt: recent[0]?.createdAt ?? null,
      recent: recent.map((item) => this.mapNotification(item)),
    };
  }

  async markAsRead(
    organizationId: string,
    notificationId: string,
  ): Promise<NotificationReadResponseDto> {
    const existing = await this.notificationsRepository.findNotificationById(
      organizationId,
      notificationId,
    );

    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    const notification = existing.isRead
      ? existing
      : await this.notificationsRepository.updateNotificationReadState({
          organizationId,
          notificationId,
          isRead: true,
        });
    const unreadCount =
      await this.notificationsRepository.countUnread(organizationId);
    const response = this.mapNotification(notification);

    this.realtimeService.publishOrganizationEvent({
      organizationId,
      domain: 'notifications',
      resource: 'notification',
      action: 'read',
      entityId: response.id,
      data: {
        notification: response,
        unreadCount,
      },
      invalidate: ['notifications.inbox', 'analytics.operations'],
    });

    return {
      notification: response,
      unreadCount,
    };
  }

  async markActivityAsRead(
    organizationId: string,
    memberId: string,
    notificationId: string,
  ): Promise<NotificationReadResponseDto> {
    const existing =
      await this.notificationsRepository.findMemberNotificationById(
        organizationId,
        memberId,
        notificationId,
      );

    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    const notification = existing.isRead
      ? existing
      : await this.notificationsRepository.updateNotificationReadState({
          organizationId,
          notificationId,
          isRead: true,
        });
    const unreadCount = await this.notificationsRepository.countMemberUnread(
      organizationId,
      memberId,
    );
    const response = this.mapNotification(notification);

    this.realtimeService.publishMemberEvent(organizationId, memberId, {
      domain: 'notifications',
      resource: 'activity',
      action: 'read',
      entityId: response.id,
      data: {
        notification: response,
        unreadCount,
      },
      invalidate: ['activity.feed'],
    });

    return {
      notification: response,
      unreadCount,
    };
  }

  async markAllAsRead(
    organizationId: string,
  ): Promise<NotificationReadAllResponseDto> {
    const result =
      await this.notificationsRepository.markAllAsRead(organizationId);

    this.realtimeService.publishOrganizationEvent({
      organizationId,
      domain: 'notifications',
      resource: 'inbox',
      action: 'read-all',
      data: {
        updatedCount: result.count,
        unreadCount: 0,
      },
      invalidate: ['notifications.inbox', 'analytics.operations'],
    });

    return {
      updatedCount: result.count,
      unreadCount: 0,
    };
  }

  async markAllActivityAsRead(
    organizationId: string,
    memberId: string,
  ): Promise<NotificationReadAllResponseDto> {
    const result = await this.notificationsRepository.markAllMemberAsRead(
      organizationId,
      memberId,
    );

    this.realtimeService.publishMemberEvent(organizationId, memberId, {
      domain: 'notifications',
      resource: 'activity',
      action: 'read-all',
      data: {
        updatedCount: result.count,
        unreadCount: 0,
      },
      invalidate: ['activity.feed'],
    });

    return {
      updatedCount: result.count,
      unreadCount: 0,
    };
  }

  async createDomainNotification(
    params: CreateDomainNotificationParams,
  ): Promise<NotificationResponseDto> {
    const data = this.toJsonValue({
      sourceDomain: params.sourceDomain,
      sourceResource: params.sourceResource,
      sourceAction: params.sourceAction,
      entityId: params.sourceEntityId ?? null,
      payload: params.payload ?? null,
    });
    const inboxEnabled = await this.notificationsRepository.isModuleEnabled(
      params.organizationId,
      SYSTEM_MODULES.notifications,
    );
    let persistedNotification: NotificationResponseDto | null = null;

    if (inboxEnabled) {
      const sharedNotification =
        await this.notificationsRepository.createNotification({
          organizationId: params.organizationId,
          type: params.type,
          title: params.title,
          message: params.message,
          data,
        });
      const response = this.mapNotification(sharedNotification);
      persistedNotification = response;

      this.realtimeService.publishOrganizationEvent({
        organizationId: params.organizationId,
        domain: 'notifications',
        resource: 'notification',
        action: 'created',
        entityId: response.id,
        data: response,
        invalidate: [
          'notifications.inbox',
          'analytics.operations',
          'analytics.dashboard',
        ],
      });
    }

    if (params.memberId || params.userId) {
      const activityNotification =
        await this.notificationsRepository.createNotification({
          organizationId: params.organizationId,
          userId: params.userId ?? null,
          memberId: params.memberId ?? null,
          type: params.type,
          title: params.title,
          message: params.message,
          data,
        });
      const response = this.mapNotification(activityNotification);
      persistedNotification ??= response;

      if (params.memberId) {
        this.realtimeService.publishMemberEvent(
          params.organizationId,
          params.memberId,
          {
            domain: 'notifications',
            resource: 'activity',
            action: 'created',
            entityId: response.id,
            data: response,
            invalidate: ['activity.feed'],
          },
        );
      } else if (params.userId) {
        this.realtimeService.publishUserEvent(
          params.organizationId,
          params.userId,
          {
            domain: 'notifications',
            resource: 'activity',
            action: 'created',
            entityId: response.id,
            data: response,
            invalidate: ['activity.feed'],
          },
        );
      }
    }

    return (
      persistedNotification ?? {
        id: '',
        type: params.type,
        title: params.title,
        message: params.message,
        data: JSON.parse(JSON.stringify(data ?? null)) as Prisma.JsonValue,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );
  }

  private mapNotification(record: NotificationRecord): NotificationResponseDto {
    return {
      id: record.id,
      type: record.type,
      title: record.title,
      message: record.message,
      data: record.data,
      isRead: record.isRead,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
    if (value === undefined) {
      return undefined;
    }

    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
