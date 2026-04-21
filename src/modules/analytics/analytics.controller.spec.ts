import { AnalyticsController } from './analytics.controller';

describe('AnalyticsController', () => {
  const analyticsService = {
    getDashboard: jest.fn(),
    getRevenue: jest.fn(),
    getMembers: jest.fn(),
    getOperations: jest.fn(),
    getCatalog: jest.fn(),
  };
  let controller: AnalyticsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AnalyticsController(analyticsService as never);
  });

  it('delegates dashboard requests to the analytics service', async () => {
    const query = { groupBy: 'day', top: 5 };
    const response = { overview: { cards: [] } };
    analyticsService.getDashboard.mockResolvedValue(response);

    await expect(
      controller.getDashboard('organization-id', query as never),
    ).resolves.toBe(response);
    expect(analyticsService.getDashboard).toHaveBeenCalledWith(
      'organization-id',
      query,
    );
  });

  it('delegates revenue requests to the analytics service', async () => {
    const query = { groupBy: 'month', top: 3 };
    const response = { invoiced: { amount: 10, currency: 'USD' } };
    analyticsService.getRevenue.mockResolvedValue(response);

    await expect(
      controller.getRevenue('organization-id', query as never),
    ).resolves.toBe(response);
    expect(analyticsService.getRevenue).toHaveBeenCalledWith(
      'organization-id',
      query,
    );
  });

  it('delegates member analytics requests to the analytics service', async () => {
    const query = { groupBy: 'week', top: 4 };
    const response = { currentMembers: 20 };
    analyticsService.getMembers.mockResolvedValue(response);

    await expect(
      controller.getMembers('organization-id', query as never),
    ).resolves.toBe(response);
    expect(analyticsService.getMembers).toHaveBeenCalledWith(
      'organization-id',
      query,
    );
  });

  it('delegates operations analytics requests to the analytics service', async () => {
    const query = { groupBy: 'day', top: 5 };
    const response = { totalLocations: 2 };
    analyticsService.getOperations.mockResolvedValue(response);

    await expect(
      controller.getOperations('organization-id', query as never),
    ).resolves.toBe(response);
    expect(analyticsService.getOperations).toHaveBeenCalledWith(
      'organization-id',
      query,
    );
  });

  it('delegates catalog requests to the analytics service', async () => {
    const response = { currencies: ['USD'] };
    analyticsService.getCatalog.mockResolvedValue(response);

    await expect(controller.getCatalog('organization-id')).resolves.toBe(
      response,
    );
    expect(analyticsService.getCatalog).toHaveBeenCalledWith('organization-id');
  });
});
