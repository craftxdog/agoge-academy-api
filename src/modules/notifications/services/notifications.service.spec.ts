import { NotFoundException } from '@nestjs/common';
import { NotificationType } from 'generated/prisma/enums';
import { NotificationsService } from './notifications.service';

const now = new Date('2026-04-20T00:00:00.000Z');

const createNotificationRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'notification-id',
  organizationId: 'organization-id',
  type: NotificationType.PAYMENT_CREATED,
  title: 'Payment created',
  message: 'Invoice INV-202604-000001 was created.',
  data: {
    sourceDomain: 'billing',
    sourceResource: 'payment',
    sourceAction: 'created',
  },
  isRead: false,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

describe('NotificationsService', () => {
  const repository = {
    findNotificationsPage: jest.fn(),
    findNotificationById: jest.fn(),
    createNotification: jest.fn(),
    updateNotificationReadState: jest.fn(),
    markAllAsRead: jest.fn(),
    countUnread: jest.fn(),
    findRecent: jest.fn(),
  };
  const realtimeService = {
    publishOrganizationEvent: jest.fn(),
  };
  let service: NotificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationsService(
      repository as never,
      realtimeService as never,
    );
  });

  it('returns summary information for the shared inbox', async () => {
    repository.countUnread.mockResolvedValue(3);
    repository.findRecent.mockResolvedValue([createNotificationRecord()]);

    const result = await service.getSummary('organization-id');

    expect(result.unreadCount).toBe(3);
    expect(result.recent).toHaveLength(1);
    expect(result.latestCreatedAt).toEqual(now);
  });

  it('marks a notification as read and emits realtime', async () => {
    repository.findNotificationById.mockResolvedValue(
      createNotificationRecord(),
    );
    repository.updateNotificationReadState.mockResolvedValue(
      createNotificationRecord({ isRead: true }),
    );
    repository.countUnread.mockResolvedValue(2);

    const result = await service.markAsRead(
      'organization-id',
      'notification-id',
    );

    expect(result.unreadCount).toBe(2);
    expect(result.notification.isRead).toBe(true);
    expect(realtimeService.publishOrganizationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'organization-id',
        domain: 'notifications',
        resource: 'notification',
        action: 'read',
      }),
    );
  });

  it('creates a domain notification and emits realtime', async () => {
    repository.createNotification.mockResolvedValue(createNotificationRecord());

    const result = await service.createDomainNotification({
      organizationId: 'organization-id',
      sourceDomain: 'billing',
      sourceResource: 'payment',
      sourceAction: 'created',
      type: NotificationType.PAYMENT_CREATED,
      title: 'Payment created',
      message: 'Invoice INV-202604-000001 was created.',
      payload: {
        id: 'payment-id',
        createdAt: now,
      },
    });

    expect(result.title).toBe('Payment created');
    expect(repository.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'organization-id',
        type: NotificationType.PAYMENT_CREATED,
      }),
    );
    expect(realtimeService.publishOrganizationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'organization-id',
        domain: 'notifications',
        resource: 'notification',
        action: 'created',
      }),
    );
  });

  it('rejects markAsRead for unknown notifications', async () => {
    repository.findNotificationById.mockResolvedValue(null);

    await expect(
      service.markAsRead('organization-id', 'missing-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
