import { BadRequestException, ConflictException } from '@nestjs/common';
import { MemberStatus, PlatformRole, UserStatus } from 'generated/prisma/enums';
import { SchedulesService } from './schedules.service';

const time = (value: string) => new Date(`1970-01-01T${value}:00.000Z`);
const date = (value: string) => new Date(`${value}T00:00:00.000Z`);
const now = new Date('2026-04-20T00:00:00.000Z');

const createLocationRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'location-id',
  organizationId: 'organization-id',
  name: 'Agoge Central Managua',
  address: 'Los Robles, Managua, Nicaragua',
  timezone: 'America/Managua',
  isActive: true,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const createBusinessHourRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'business-hour-id',
  organizationId: 'organization-id',
  locationId: null,
  dayOfWeek: 1,
  startTime: time('06:00'),
  endTime: time('10:00'),
  isClosed: false,
  createdAt: now,
  updatedAt: now,
  location: null,
  ...overrides,
});

const createExceptionRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'exception-id',
  organizationId: 'organization-id',
  locationId: null,
  date: date('2026-09-14'),
  name: 'Batalla de San Jacinto',
  startTime: null,
  endTime: null,
  isClosed: true,
  createdAt: now,
  updatedAt: now,
  location: null,
  ...overrides,
});

const createMemberRecord = () => ({
  id: 'member-id',
  organizationId: 'organization-id',
  userId: 'user-id',
  status: MemberStatus.ACTIVE,
  phone: null,
  documentId: null,
  address: null,
  joinedAt: now,
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
  user: {
    id: 'user-id',
    email: 'coach@agoge.com',
    username: 'coach',
    passwordHash: 'hash',
    firstName: 'Alex',
    lastName: 'Coach',
    platformRole: PlatformRole.USER,
    status: UserStatus.ACTIVE,
    refreshTokenHash: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  },
});

const createMemberScheduleRecord = (
  overrides: Record<string, unknown> = {},
) => ({
  id: 'member-schedule-id',
  memberId: 'member-id',
  locationId: null,
  dayOfWeek: 1,
  startTime: time('06:00'),
  endTime: time('10:00'),
  createdAt: now,
  updatedAt: now,
  member: createMemberRecord(),
  location: null,
  ...overrides,
});

describe('SchedulesService', () => {
  const repository = {
    findLocations: jest.fn(),
    findLocationById: jest.fn(),
    findLocationByName: jest.fn(),
    createLocation: jest.fn(),
    updateLocation: jest.fn(),
    locationHasScheduleData: jest.fn(),
    deleteLocation: jest.fn(),
    findBusinessHours: jest.fn(),
    findBusinessHoursForScope: jest.fn(),
    findBusinessHourById: jest.fn(),
    createBusinessHour: jest.fn(),
    updateBusinessHour: jest.fn(),
    deleteBusinessHour: jest.fn(),
    replaceBusinessHoursForScope: jest.fn(),
    findExceptions: jest.fn(),
    findExceptionsForDate: jest.fn(),
    findExceptionById: jest.fn(),
    createException: jest.fn(),
    updateException: jest.fn(),
    deleteException: jest.fn(),
    findMember: jest.fn(),
    findMemberSchedules: jest.fn(),
    findMemberSchedulesForDay: jest.fn(),
    findMemberScheduleById: jest.fn(),
    findMemberSchedulesForScope: jest.fn(),
    createMemberSchedule: jest.fn(),
    updateMemberSchedule: jest.fn(),
    deleteMemberSchedule: jest.fn(),
    replaceMemberSchedules: jest.fn(),
  };
  let service: SchedulesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SchedulesService(repository as never);
  });

  it('defaults new locations to America/Managua timezone', async () => {
    repository.findLocationByName.mockResolvedValue(null);
    repository.createLocation.mockResolvedValue(createLocationRecord());

    await service.createLocation('organization-id', {
      name: 'Agoge Central Managua',
    });

    expect(repository.createLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        timezone: 'America/Managua',
      }),
    );
  });

  it('rejects overlapping business-hour windows in the same scope', async () => {
    repository.findBusinessHoursForScope.mockResolvedValue([
      createBusinessHourRecord(),
    ]);

    await expect(
      service.createBusinessHour('organization-id', {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '11:00',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.createBusinessHour).not.toHaveBeenCalled();
  });

  it('requires times when an exception defines special opening hours', async () => {
    await expect(
      service.createException('organization-id', {
        date: '2026-09-14',
        name: 'Special Opening',
        isClosed: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.createException).not.toHaveBeenCalled();
  });

  it('deactivates locations that already have schedule data', async () => {
    repository.findLocationById.mockResolvedValue(createLocationRecord());
    repository.locationHasScheduleData.mockResolvedValue(true);
    repository.updateLocation.mockResolvedValue(
      createLocationRecord({ isActive: false }),
    );

    const result = await service.deleteLocation(
      'organization-id',
      'location-id',
    );

    expect(repository.deleteLocation).not.toHaveBeenCalled();
    expect(repository.updateLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'location-id',
        isActive: false,
      }),
    );
    expect(result.isActive).toBe(false);
  });

  it('uses full-day closure exceptions to close an effective day', async () => {
    repository.findLocationById.mockResolvedValue(null);
    repository.findBusinessHoursForScope.mockResolvedValue([
      createBusinessHourRecord(),
    ]);
    repository.findExceptionsForDate.mockResolvedValue([
      createExceptionRecord({ date: date('2026-09-14') }),
    ]);
    repository.findMemberSchedulesForDay.mockResolvedValue([
      createMemberScheduleRecord(),
    ]);

    const result = await service.getDaySchedule('organization-id', {
      date: '2026-09-14',
    });

    expect(result.dayOfWeek).toBe(1);
    expect(result.dayName).toBe('monday');
    expect(result.isClosed).toBe(true);
    expect(result.businessHours).toHaveLength(0);
    expect(result.timezone).toBe('America/Managua');
  });
});
