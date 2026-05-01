import { NotificationsActivityController } from './notifications-activity.controller';

describe('NotificationsActivityController', () => {
  const notificationsService = {
    listActivity: jest.fn(),
    getActivitySummary: jest.fn(),
    markActivityAsRead: jest.fn(),
    markAllActivityAsRead: jest.fn(),
  };
  let controller: NotificationsActivityController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new NotificationsActivityController(
      notificationsService as never,
    );
  });

  it('delegates activity listing to the notifications service', async () => {
    const query = { limit: 20, sortBy: 'createdAt', sortDirection: 'desc' };
    const response = { items: [], pagination: { strategy: 'cursor' } };
    notificationsService.listActivity.mockResolvedValue(response);

    await expect(
      controller.listActivity('organization-id', 'member-id', query as never),
    ).resolves.toBe(response);
    expect(notificationsService.listActivity).toHaveBeenCalledWith(
      'organization-id',
      'member-id',
      query,
    );
  });

  it('delegates activity summary requests to the notifications service', async () => {
    const response = { unreadCount: 1, recent: [] };
    notificationsService.getActivitySummary.mockResolvedValue(response);

    await expect(
      controller.getActivitySummary('organization-id', 'member-id'),
    ).resolves.toBe(response);
    expect(notificationsService.getActivitySummary).toHaveBeenCalledWith(
      'organization-id',
      'member-id',
    );
  });

  it('delegates activity markAsRead requests to the notifications service', async () => {
    const response = {
      notification: { id: 'notification-id' },
      unreadCount: 0,
    };
    notificationsService.markActivityAsRead.mockResolvedValue(response);

    await expect(
      controller.markActivityAsRead(
        'organization-id',
        'member-id',
        'notification-id',
      ),
    ).resolves.toBe(response);
    expect(notificationsService.markActivityAsRead).toHaveBeenCalledWith(
      'organization-id',
      'member-id',
      'notification-id',
    );
  });

  it('delegates activity markAllAsRead requests to the notifications service', async () => {
    const response = { updatedCount: 2, unreadCount: 0 };
    notificationsService.markAllActivityAsRead.mockResolvedValue(response);

    await expect(
      controller.markAllActivityAsRead('organization-id', 'member-id'),
    ).resolves.toBe(response);
    expect(notificationsService.markAllActivityAsRead).toHaveBeenCalledWith(
      'organization-id',
      'member-id',
    );
  });
});
