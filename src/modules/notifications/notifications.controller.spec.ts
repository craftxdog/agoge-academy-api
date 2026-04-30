import { NotificationsController } from './notifications.controller';

describe('NotificationsController', () => {
  const notificationsService = {
    listNotifications: jest.fn(),
    getSummary: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  };
  let controller: NotificationsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new NotificationsController(notificationsService as never);
  });

  it('delegates inbox listing to the notifications service', async () => {
    const query = { limit: 20, sortBy: 'createdAt', sortDirection: 'desc' };
    const response = { items: [], pagination: { strategy: 'cursor' } };
    notificationsService.listNotifications.mockResolvedValue(response);

    await expect(
      controller.listNotifications('organization-id', query as never),
    ).resolves.toBe(response);
    expect(notificationsService.listNotifications).toHaveBeenCalledWith(
      'organization-id',
      query,
    );
  });

  it('delegates summary requests to the notifications service', async () => {
    const response = { unreadCount: 3, recent: [] };
    notificationsService.getSummary.mockResolvedValue(response);

    await expect(controller.getSummary('organization-id')).resolves.toBe(
      response,
    );
    expect(notificationsService.getSummary).toHaveBeenCalledWith(
      'organization-id',
    );
  });

  it('delegates markAsRead requests to the notifications service', async () => {
    const response = {
      notification: { id: 'notification-id' },
      unreadCount: 2,
    };
    notificationsService.markAsRead.mockResolvedValue(response);

    await expect(
      controller.markAsRead('organization-id', 'notification-id'),
    ).resolves.toBe(response);
    expect(notificationsService.markAsRead).toHaveBeenCalledWith(
      'organization-id',
      'notification-id',
    );
  });

  it('delegates markAllAsRead requests to the notifications service', async () => {
    const response = { updatedCount: 3, unreadCount: 0 };
    notificationsService.markAllAsRead.mockResolvedValue(response);

    await expect(controller.markAllAsRead('organization-id')).resolves.toBe(
      response,
    );
    expect(notificationsService.markAllAsRead).toHaveBeenCalledWith(
      'organization-id',
    );
  });
});
