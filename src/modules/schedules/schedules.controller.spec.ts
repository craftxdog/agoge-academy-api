import { SchedulesController } from './schedules.controller';

describe('SchedulesController', () => {
  const schedulesService = {
    getDaySchedule: jest.fn(),
    listLocations: jest.fn(),
    createLocation: jest.fn(),
    updateLocation: jest.fn(),
    deleteLocation: jest.fn(),
    listBusinessHours: jest.fn(),
    createBusinessHour: jest.fn(),
    replaceBusinessHours: jest.fn(),
    updateBusinessHour: jest.fn(),
    deleteBusinessHour: jest.fn(),
    listExceptions: jest.fn(),
    createException: jest.fn(),
    updateException: jest.fn(),
    deleteException: jest.fn(),
    listMemberSchedules: jest.fn(),
    createMemberSchedule: jest.fn(),
    replaceMemberSchedules: jest.fn(),
    updateMemberSchedule: jest.fn(),
    deleteMemberSchedule: jest.fn(),
  };
  let controller: SchedulesController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new SchedulesController(schedulesService as never);
  });

  it('delegates day schedule and location requests', async () => {
    const query = { date: '2026-04-21', memberId: 'member-id' };
    const locationDto = { name: 'Main Branch' };
    const response = { id: 'location-id' };
    schedulesService.getDaySchedule.mockResolvedValue(response);
    schedulesService.listLocations.mockResolvedValue([response]);
    schedulesService.createLocation.mockResolvedValue(response);
    schedulesService.updateLocation.mockResolvedValue(response);
    schedulesService.deleteLocation.mockResolvedValue(response);

    await expect(
      controller.getDaySchedule('organization-id', query as never),
    ).resolves.toBe(response);
    await expect(
      controller.listLocations('organization-id', {} as never),
    ).resolves.toEqual([response]);
    await expect(
      controller.createLocation('organization-id', locationDto as never),
    ).resolves.toBe(response);
    await expect(
      controller.updateLocation('organization-id', 'location-id', locationDto as never),
    ).resolves.toBe(response);
    await expect(
      controller.deleteLocation('organization-id', 'location-id'),
    ).resolves.toBe(response);
  });

  it('delegates business hour requests', async () => {
    const dto = { dayOfWeek: 1, startTime: '08:00', endTime: '17:00' };
    const response = { id: 'business-hour-id' };
    schedulesService.listBusinessHours.mockResolvedValue([response]);
    schedulesService.createBusinessHour.mockResolvedValue(response);
    schedulesService.replaceBusinessHours.mockResolvedValue([response]);
    schedulesService.updateBusinessHour.mockResolvedValue(response);
    schedulesService.deleteBusinessHour.mockResolvedValue(response);

    await expect(
      controller.listBusinessHours('organization-id', {} as never),
    ).resolves.toEqual([response]);
    await expect(
      controller.createBusinessHour('organization-id', dto as never),
    ).resolves.toBe(response);
    await expect(
      controller.replaceBusinessHours(
        'organization-id',
        { hours: [dto] } as never,
      ),
    ).resolves.toEqual([response]);
    await expect(
      controller.updateBusinessHour(
        'organization-id',
        'business-hour-id',
        { endTime: '18:00' } as never,
      ),
    ).resolves.toBe(response);
    await expect(
      controller.deleteBusinessHour('organization-id', 'business-hour-id'),
    ).resolves.toBe(response);
  });

  it('delegates exception requests', async () => {
    const dto = { date: '2026-12-25', name: 'Christmas' };
    const response = { id: 'exception-id' };
    schedulesService.listExceptions.mockResolvedValue([response]);
    schedulesService.createException.mockResolvedValue(response);
    schedulesService.updateException.mockResolvedValue(response);
    schedulesService.deleteException.mockResolvedValue(response);

    await expect(
      controller.listExceptions('organization-id', {} as never),
    ).resolves.toEqual([response]);
    await expect(
      controller.createException('organization-id', dto as never),
    ).resolves.toBe(response);
    await expect(
      controller.updateException(
        'organization-id',
        'exception-id',
        { name: 'Holiday' } as never,
      ),
    ).resolves.toBe(response);
    await expect(
      controller.deleteException('organization-id', 'exception-id'),
    ).resolves.toBe(response);
  });

  it('delegates member availability requests', async () => {
    const response = { id: 'schedule-id' };
    schedulesService.listMemberSchedules.mockResolvedValue([response]);
    schedulesService.createMemberSchedule.mockResolvedValue(response);
    schedulesService.replaceMemberSchedules.mockResolvedValue([response]);
    schedulesService.updateMemberSchedule.mockResolvedValue(response);
    schedulesService.deleteMemberSchedule.mockResolvedValue(response);

    await expect(
      controller.listMemberSchedules(
        'organization-id',
        'member-id',
        {} as never,
      ),
    ).resolves.toEqual([response]);
    await expect(
      controller.createMemberSchedule(
        'organization-id',
        'member-id',
        { dayOfWeek: 1, startTime: '08:00', endTime: '10:00' } as never,
      ),
    ).resolves.toBe(response);
    await expect(
      controller.replaceMemberSchedules(
        'organization-id',
        'member-id',
        {
          schedules: [{ dayOfWeek: 1, startTime: '08:00', endTime: '10:00' }],
        } as never,
      ),
    ).resolves.toEqual([response]);
    await expect(
      controller.updateMemberSchedule(
        'organization-id',
        'schedule-id',
        { endTime: '11:00' } as never,
      ),
    ).resolves.toBe(response);
    await expect(
      controller.deleteMemberSchedule('organization-id', 'schedule-id'),
    ).resolves.toBe(response);
  });
});
