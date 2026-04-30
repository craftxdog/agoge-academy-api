import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType } from 'generated/prisma/enums';
import { NotificationsService } from '../../notifications';
import {
  BusinessHourQueryDto,
  BusinessHourResponseDto,
  CreateBusinessHourDto,
  CreateLocationDto,
  CreateMemberScheduleDto,
  CreateScheduleExceptionDto,
  DayScheduleQueryDto,
  DayScheduleResponseDto,
  LocationQueryDto,
  LocationResponseDto,
  MemberScheduleQueryDto,
  MemberScheduleResponseDto,
  ReplaceMemberSchedulesDto,
  ScheduleExceptionQueryDto,
  ScheduleExceptionResponseDto,
  UpdateBusinessHourDto,
  UpdateLocationDto,
  UpdateMemberScheduleDto,
  UpdateScheduleExceptionDto,
  UpsertBusinessHoursDto,
} from '../dto';
import {
  ScheduleBusinessHourRecord,
  ScheduleExceptionRecord,
  ScheduleLocationRecord,
  ScheduleMemberRecord,
  ScheduleMemberScheduleRecord,
  SchedulesRepository,
} from '../repositories';
import { RealtimeService } from '../../realtime';
import {
  assertLocalDate,
  assertSupportedTimezone,
  assertTimeRange,
  clockTimeToMinutes,
  dayName,
  formatClockTime,
  formatLocalDate,
  getLocalDayOfWeek,
  NICARAGUA_TIMEZONE,
  parseClockTime,
  parseLocalDate,
} from '../utils/schedule-time.util';

type TimeWindow = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    private readonly schedulesRepository: SchedulesRepository,
    private readonly realtimeService: RealtimeService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listLocations(
    organizationId: string,
    query: LocationQueryDto,
  ): Promise<LocationResponseDto[]> {
    const locations = await this.schedulesRepository.findLocations(
      organizationId,
      query,
    );

    return locations.map((location) => this.mapLocation(location));
  }

  async createLocation(
    organizationId: string,
    dto: CreateLocationDto,
  ): Promise<LocationResponseDto> {
    const name = this.normalizeName(dto.name);
    const timezone = this.normalizeTimezone(dto.timezone);

    if (
      await this.schedulesRepository.findLocationByName(organizationId, name)
    ) {
      throw new ConflictException('Location name already exists');
    }

    const location = await this.schedulesRepository.createLocation({
      organizationId,
      name,
      address: dto.address?.trim(),
      timezone,
      isActive: dto.isActive ?? true,
    });

    const response = this.mapLocation(location);

    this.emitSchedulesEvent({
      organizationId,
      resource: 'location',
      action: 'created',
      entityId: response.id,
      data: response,
      invalidate: [
        'schedules.locations',
        'schedules.day',
        'analytics.operations',
        'analytics.dashboard',
      ],
    });

    return response;
  }

  async updateLocation(
    organizationId: string,
    locationId: string,
    dto: UpdateLocationDto,
  ): Promise<LocationResponseDto> {
    const currentLocation = await this.getLocationOrThrow(
      organizationId,
      locationId,
    );
    const name = dto.name ? this.normalizeName(dto.name) : undefined;

    if (name && name !== currentLocation.name) {
      const existing = await this.schedulesRepository.findLocationByName(
        organizationId,
        name,
      );

      if (existing && existing.id !== locationId) {
        throw new ConflictException('Location name already exists');
      }
    }

    const location = await this.schedulesRepository.updateLocation({
      organizationId,
      id: locationId,
      name,
      address: dto.address?.trim(),
      timezone: dto.timezone ? this.normalizeTimezone(dto.timezone) : undefined,
      isActive: dto.isActive,
    });

    const response = this.mapLocation(location);

    this.emitSchedulesEvent({
      organizationId,
      resource: 'location',
      action: 'updated',
      entityId: response.id,
      data: response,
      invalidate: [
        'schedules.locations',
        'schedules.day',
        'analytics.operations',
        'analytics.dashboard',
      ],
    });

    return response;
  }

  async deleteLocation(
    organizationId: string,
    locationId: string,
  ): Promise<LocationResponseDto> {
    const location = await this.getLocationOrThrow(organizationId, locationId);

    if (
      await this.schedulesRepository.locationHasScheduleData(
        organizationId,
        locationId,
      )
    ) {
      const inactive = await this.schedulesRepository.updateLocation({
        organizationId,
        id: locationId,
        isActive: false,
      });

      const response = this.mapLocation(inactive);

      this.emitSchedulesEvent({
        organizationId,
        resource: 'location',
        action: 'archived',
        entityId: response.id,
        data: response,
        invalidate: [
          'schedules.locations',
          'schedules.day',
          'analytics.operations',
          'analytics.dashboard',
        ],
      });

      return response;
    }

    const deleted = await this.schedulesRepository.deleteLocation(
      organizationId,
      location.id,
    );

    const response = this.mapLocation(deleted);

    this.emitSchedulesEvent({
      organizationId,
      resource: 'location',
      action: 'deleted',
      entityId: response.id,
      data: response,
      invalidate: [
        'schedules.locations',
        'schedules.day',
        'analytics.operations',
        'analytics.dashboard',
      ],
    });

    return response;
  }

  async listBusinessHours(
    organizationId: string,
    query: BusinessHourQueryDto,
  ): Promise<BusinessHourResponseDto[]> {
    if (query.locationId) {
      await this.getLocationOrThrow(organizationId, query.locationId);
    }

    const hours = await this.schedulesRepository.findBusinessHours(
      organizationId,
      query,
    );

    return hours.map((hour) => this.mapBusinessHour(hour));
  }

  async createBusinessHour(
    organizationId: string,
    dto: CreateBusinessHourDto,
  ): Promise<BusinessHourResponseDto> {
    const locationId = await this.resolveLocationId(
      organizationId,
      dto.locationId,
    );
    this.assertTimeWindow(dto.startTime, dto.endTime);
    await this.assertNoBusinessHourOverlap({
      organizationId,
      locationId,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
    });

    const hour = await this.schedulesRepository.createBusinessHour({
      organizationId,
      locationId,
      dayOfWeek: dto.dayOfWeek,
      startTime: parseClockTime(dto.startTime),
      endTime: parseClockTime(dto.endTime),
      isClosed: dto.isClosed ?? false,
    });

    const response = this.mapBusinessHour(hour);

    this.emitSchedulesEvent({
      organizationId,
      resource: 'business-hours',
      action: 'created',
      entityId: response.id,
      data: response,
      invalidate: [
        'schedules.business-hours',
        'schedules.day',
        'analytics.operations',
        'analytics.dashboard',
      ],
    });

    return response;
  }

  async replaceBusinessHours(
    organizationId: string,
    dto: UpsertBusinessHoursDto,
  ): Promise<BusinessHourResponseDto[]> {
    const locationId = await this.resolveBulkLocationId(
      organizationId,
      dto.hours.map((hour) => hour.locationId),
    );
    this.assertUniqueScope(dto.hours.map((hour) => hour.locationId));
    this.assertNoOverlaps(
      dto.hours.map((hour) => ({
        dayOfWeek: hour.dayOfWeek,
        startTime: hour.startTime,
        endTime: hour.endTime,
      })),
    );

    const hours = await this.schedulesRepository.replaceBusinessHoursForScope({
      organizationId,
      locationId,
      hours: dto.hours.map((hour) => ({
        dayOfWeek: hour.dayOfWeek,
        startTime: parseClockTime(hour.startTime),
        endTime: parseClockTime(hour.endTime),
        isClosed: hour.isClosed ?? false,
      })),
    });

    const response = hours.map((hour) => this.mapBusinessHour(hour));

    this.emitSchedulesEvent({
      organizationId,
      resource: 'business-hours',
      action: 'replaced',
      entityId: locationId,
      data: response,
      invalidate: [
        'schedules.business-hours',
        'schedules.day',
        'analytics.operations',
        'analytics.dashboard',
      ],
    });

    return response;
  }

  async updateBusinessHour(
    organizationId: string,
    businessHourId: string,
    dto: UpdateBusinessHourDto,
  ): Promise<BusinessHourResponseDto> {
    const currentHour = await this.getBusinessHourOrThrow(
      organizationId,
      businessHourId,
    );
    const startTime = dto.startTime ?? formatClockTime(currentHour.startTime);
    const endTime = dto.endTime ?? formatClockTime(currentHour.endTime);

    this.assertTimeWindow(startTime, endTime);
    await this.assertNoBusinessHourOverlap({
      organizationId,
      locationId: currentHour.locationId,
      dayOfWeek: currentHour.dayOfWeek,
      startTime,
      endTime,
      excludeId: currentHour.id,
    });

    const hour = await this.schedulesRepository.updateBusinessHour({
      organizationId,
      id: businessHourId,
      startTime: dto.startTime ? parseClockTime(dto.startTime) : undefined,
      endTime: dto.endTime ? parseClockTime(dto.endTime) : undefined,
      isClosed: dto.isClosed,
    });

    const response = this.mapBusinessHour(hour);

    this.emitSchedulesEvent({
      organizationId,
      resource: 'business-hours',
      action: 'updated',
      entityId: response.id,
      data: response,
      invalidate: [
        'schedules.business-hours',
        'schedules.day',
        'analytics.operations',
        'analytics.dashboard',
      ],
    });

    return response;
  }

  async deleteBusinessHour(
    organizationId: string,
    businessHourId: string,
  ): Promise<BusinessHourResponseDto> {
    await this.getBusinessHourOrThrow(organizationId, businessHourId);
    const deleted = await this.schedulesRepository.deleteBusinessHour(
      organizationId,
      businessHourId,
    );

    const response = this.mapBusinessHour(deleted);

    this.emitSchedulesEvent({
      organizationId,
      resource: 'business-hours',
      action: 'deleted',
      entityId: response.id,
      data: response,
      invalidate: [
        'schedules.business-hours',
        'schedules.day',
        'analytics.operations',
        'analytics.dashboard',
      ],
    });

    return response;
  }

  async listExceptions(
    organizationId: string,
    query: ScheduleExceptionQueryDto,
  ): Promise<ScheduleExceptionResponseDto[]> {
    if (query.locationId) {
      await this.getLocationOrThrow(organizationId, query.locationId);
    }

    if (query.dateFrom && query.dateTo) {
      this.assertDateRange(query.dateFrom, query.dateTo);
    }

    const exceptions = await this.schedulesRepository.findExceptions(
      organizationId,
      query,
    );

    return exceptions.map((exception) => this.mapException(exception));
  }

  async createException(
    organizationId: string,
    dto: CreateScheduleExceptionDto,
  ): Promise<ScheduleExceptionResponseDto> {
    const locationId = await this.resolveLocationId(
      organizationId,
      dto.locationId,
    );
    const normalized = this.normalizeExceptionWindow(dto);
    const exception = await this.schedulesRepository.createException({
      organizationId,
      locationId,
      date: parseLocalDate(dto.date),
      name: this.normalizeName(dto.name),
      startTime: normalized.startTime
        ? parseClockTime(normalized.startTime)
        : null,
      endTime: normalized.endTime ? parseClockTime(normalized.endTime) : null,
      isClosed: normalized.isClosed,
    });

    const response = this.mapException(exception);

    this.emitSchedulesEvent({
      organizationId,
      resource: 'exception',
      action: 'created',
      entityId: response.id,
      data: response,
      invalidate: [
        'schedules.exceptions',
        'schedules.day',
        'analytics.operations',
        'analytics.dashboard',
      ],
    });

    return response;
  }

  async updateException(
    organizationId: string,
    exceptionId: string,
    dto: UpdateScheduleExceptionDto,
  ): Promise<ScheduleExceptionResponseDto> {
    const currentException = await this.getExceptionOrThrow(
      organizationId,
      exceptionId,
    );
    const normalized = this.normalizeExceptionWindow({
      date: formatLocalDate(currentException.date),
      name: dto.name ?? currentException.name,
      startTime:
        dto.startTime ??
        (currentException.startTime
          ? formatClockTime(currentException.startTime)
          : undefined),
      endTime:
        dto.endTime ??
        (currentException.endTime
          ? formatClockTime(currentException.endTime)
          : undefined),
      isClosed: dto.isClosed ?? currentException.isClosed,
    });

    const exception = await this.schedulesRepository.updateException({
      organizationId,
      id: exceptionId,
      name: dto.name ? this.normalizeName(dto.name) : undefined,
      startTime:
        dto.startTime !== undefined
          ? parseClockTime(normalized.startTime as string)
          : undefined,
      endTime:
        dto.endTime !== undefined
          ? parseClockTime(normalized.endTime as string)
          : undefined,
      isClosed: dto.isClosed,
    });

    const response = this.mapException(exception);

    this.emitSchedulesEvent({
      organizationId,
      resource: 'exception',
      action: 'updated',
      entityId: response.id,
      data: response,
      invalidate: [
        'schedules.exceptions',
        'schedules.day',
        'analytics.operations',
        'analytics.dashboard',
      ],
    });

    return response;
  }

  async deleteException(
    organizationId: string,
    exceptionId: string,
  ): Promise<ScheduleExceptionResponseDto> {
    await this.getExceptionOrThrow(organizationId, exceptionId);
    const deleted = await this.schedulesRepository.deleteException(
      organizationId,
      exceptionId,
    );

    const response = this.mapException(deleted);

    this.emitSchedulesEvent({
      organizationId,
      resource: 'exception',
      action: 'deleted',
      entityId: response.id,
      data: response,
      invalidate: [
        'schedules.exceptions',
        'schedules.day',
        'analytics.operations',
        'analytics.dashboard',
      ],
    });

    return response;
  }

  async listMemberSchedules(
    organizationId: string,
    memberId: string,
    query: MemberScheduleQueryDto,
  ): Promise<MemberScheduleResponseDto[]> {
    await this.getMemberOrThrow(organizationId, memberId);

    if (query.locationId) {
      await this.getLocationOrThrow(organizationId, query.locationId);
    }

    const schedules = await this.schedulesRepository.findMemberSchedules(
      organizationId,
      memberId,
      query,
    );

    return schedules.map((schedule) => this.mapMemberSchedule(schedule));
  }

  async createMemberSchedule(
    organizationId: string,
    memberId: string,
    dto: CreateMemberScheduleDto,
  ): Promise<MemberScheduleResponseDto> {
    const member = await this.getMemberOrThrow(organizationId, memberId);
    const locationId = await this.resolveLocationId(
      organizationId,
      dto.locationId,
    );
    this.assertTimeWindow(dto.startTime, dto.endTime);
    await this.assertNoMemberScheduleOverlap({
      organizationId,
      memberId: member.id,
      locationId,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
    });

    const schedule = await this.schedulesRepository.createMemberSchedule({
      memberId: member.id,
      locationId,
      dayOfWeek: dto.dayOfWeek,
      startTime: parseClockTime(dto.startTime),
      endTime: parseClockTime(dto.endTime),
    });

    const response = this.mapMemberSchedule(schedule);

    this.emitSchedulesEvent({
      organizationId,
      resource: 'member-availability',
      action: 'created',
      entityId: response.id,
      data: response,
      invalidate: [
        'schedules.member-availability',
        'schedules.day',
        'analytics.operations',
        'analytics.dashboard',
      ],
    });

    return response;
  }

  async replaceMemberSchedules(
    organizationId: string,
    memberId: string,
    dto: ReplaceMemberSchedulesDto,
  ): Promise<MemberScheduleResponseDto[]> {
    const member = await this.getMemberOrThrow(organizationId, memberId);

    await Promise.all(
      [...new Set(dto.schedules.map((schedule) => schedule.locationId))]
        .filter(Boolean)
        .map((locationId) =>
          this.getLocationOrThrow(organizationId, locationId as string),
        ),
    );
    this.assertNoOverlaps(
      dto.schedules.map((schedule) => ({
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        id: schedule.locationId ?? 'organization',
      })),
    );

    const schedules = await this.schedulesRepository.replaceMemberSchedules({
      organizationId,
      memberId: member.id,
      schedules: dto.schedules.map((schedule) => ({
        locationId: schedule.locationId ?? null,
        dayOfWeek: schedule.dayOfWeek,
        startTime: parseClockTime(schedule.startTime),
        endTime: parseClockTime(schedule.endTime),
      })),
    });

    const response = schedules.map((schedule) =>
      this.mapMemberSchedule(schedule),
    );

    this.emitSchedulesEvent({
      organizationId,
      resource: 'member-availability',
      action: 'replaced',
      entityId: member.id,
      data: response,
      invalidate: [
        'schedules.member-availability',
        'schedules.day',
        'analytics.operations',
        'analytics.dashboard',
      ],
    });

    return response;
  }

  async updateMemberSchedule(
    organizationId: string,
    scheduleId: string,
    dto: UpdateMemberScheduleDto,
  ): Promise<MemberScheduleResponseDto> {
    const currentSchedule = await this.getMemberScheduleOrThrow(
      organizationId,
      scheduleId,
    );
    const startTime =
      dto.startTime ?? formatClockTime(currentSchedule.startTime);
    const endTime = dto.endTime ?? formatClockTime(currentSchedule.endTime);

    this.assertTimeWindow(startTime, endTime);
    await this.assertNoMemberScheduleOverlap({
      organizationId,
      memberId: currentSchedule.memberId,
      locationId: currentSchedule.locationId,
      dayOfWeek: currentSchedule.dayOfWeek,
      startTime,
      endTime,
      excludeId: currentSchedule.id,
    });

    const schedule = await this.schedulesRepository.updateMemberSchedule({
      organizationId,
      id: scheduleId,
      startTime: dto.startTime ? parseClockTime(dto.startTime) : undefined,
      endTime: dto.endTime ? parseClockTime(dto.endTime) : undefined,
    });

    const response = this.mapMemberSchedule(schedule);

    this.emitSchedulesEvent({
      organizationId,
      resource: 'member-availability',
      action: 'updated',
      entityId: response.id,
      data: response,
      invalidate: [
        'schedules.member-availability',
        'schedules.day',
        'analytics.operations',
        'analytics.dashboard',
      ],
    });

    return response;
  }

  async deleteMemberSchedule(
    organizationId: string,
    scheduleId: string,
  ): Promise<MemberScheduleResponseDto> {
    await this.getMemberScheduleOrThrow(organizationId, scheduleId);
    const deleted =
      await this.schedulesRepository.deleteMemberSchedule(scheduleId);

    const response = this.mapMemberSchedule(deleted);

    this.emitSchedulesEvent({
      organizationId,
      resource: 'member-availability',
      action: 'deleted',
      entityId: response.id,
      data: response,
      invalidate: [
        'schedules.member-availability',
        'schedules.day',
        'analytics.operations',
        'analytics.dashboard',
      ],
    });

    return response;
  }

  async getDaySchedule(
    organizationId: string,
    query: DayScheduleQueryDto,
  ): Promise<DayScheduleResponseDto> {
    const date = query.date ?? this.getTodayInNicaragua();
    assertLocalDate(date);
    const dayOfWeek = getLocalDayOfWeek(date);
    const location = query.locationId
      ? await this.getLocationOrThrow(organizationId, query.locationId)
      : null;
    const [organizationHours, locationHours, exceptions, memberSchedules] =
      await Promise.all([
        this.schedulesRepository.findBusinessHoursForScope({
          organizationId,
          locationId: null,
          dayOfWeek,
        }),
        location
          ? this.schedulesRepository.findBusinessHoursForScope({
              organizationId,
              locationId: location.id,
              dayOfWeek,
            })
          : Promise.resolve([]),
        this.schedulesRepository.findExceptionsForDate({
          organizationId,
          locationId: location?.id ?? null,
          date: parseLocalDate(date),
        }),
        this.schedulesRepository.findMemberSchedulesForDay({
          organizationId,
          locationId: location?.id ?? null,
          dayOfWeek,
        }),
      ]);
    const fullDayClosed = exceptions.some(
      (exception) =>
        exception.isClosed && !exception.startTime && !exception.endTime,
    );
    const specialOpenings = exceptions.filter(
      (exception) =>
        !exception.isClosed && exception.startTime && exception.endTime,
    );
    const baseHours =
      locationHours.length > 0 ? locationHours : organizationHours;
    const businessHours = fullDayClosed
      ? []
      : specialOpenings.length > 0
        ? specialOpenings.map((exception) =>
            this.mapExceptionAsBusinessHour(exception, dayOfWeek),
          )
        : baseHours
            .filter((hour) => !hour.isClosed)
            .map((hour) => this.mapBusinessHour(hour));

    return {
      date,
      dayOfWeek,
      dayName: dayName(dayOfWeek),
      timezone: location?.timezone ?? NICARAGUA_TIMEZONE,
      location: location ? this.mapLocation(location) : null,
      businessHours,
      exceptions: exceptions.map((exception) => this.mapException(exception)),
      memberSchedules: memberSchedules.map((schedule) =>
        this.mapMemberSchedule(schedule),
      ),
      isClosed: businessHours.length === 0,
    };
  }

  private async getLocationOrThrow(
    organizationId: string,
    locationId: string,
  ): Promise<ScheduleLocationRecord> {
    const location = await this.schedulesRepository.findLocationById(
      organizationId,
      locationId,
    );

    if (!location) {
      throw new NotFoundException('Location was not found in this tenant');
    }

    return location;
  }

  private async getBusinessHourOrThrow(
    organizationId: string,
    businessHourId: string,
  ): Promise<ScheduleBusinessHourRecord> {
    const hour = await this.schedulesRepository.findBusinessHourById(
      organizationId,
      businessHourId,
    );

    if (!hour) {
      throw new NotFoundException('Business hour was not found in this tenant');
    }

    return hour;
  }

  private async getExceptionOrThrow(
    organizationId: string,
    exceptionId: string,
  ): Promise<ScheduleExceptionRecord> {
    const exception = await this.schedulesRepository.findExceptionById(
      organizationId,
      exceptionId,
    );

    if (!exception) {
      throw new NotFoundException(
        'Schedule exception was not found in this tenant',
      );
    }

    return exception;
  }

  private async getMemberOrThrow(
    organizationId: string,
    memberId: string,
  ): Promise<ScheduleMemberRecord> {
    const member = await this.schedulesRepository.findMember(
      organizationId,
      memberId,
    );

    if (!member) {
      throw new NotFoundException('Member was not found in this tenant');
    }

    return member;
  }

  private async getMemberScheduleOrThrow(
    organizationId: string,
    scheduleId: string,
  ): Promise<ScheduleMemberScheduleRecord> {
    const schedule = await this.schedulesRepository.findMemberScheduleById(
      organizationId,
      scheduleId,
    );

    if (!schedule) {
      throw new NotFoundException(
        'Member schedule was not found in this tenant',
      );
    }

    return schedule;
  }

  private async resolveLocationId(
    organizationId: string,
    locationId?: string,
  ): Promise<string | null> {
    if (!locationId) {
      return null;
    }

    await this.getLocationOrThrow(organizationId, locationId);
    return locationId;
  }

  private async resolveBulkLocationId(
    organizationId: string,
    locationIds: Array<string | undefined>,
  ): Promise<string | null> {
    const normalizedLocationIds = [
      ...new Set(locationIds.map((locationId) => locationId ?? null)),
    ];

    if (normalizedLocationIds.length > 1) {
      throw new BadRequestException(
        'Bulk business hours must target one location scope at a time',
      );
    }

    const locationId = normalizedLocationIds[0];

    if (!locationId) {
      return null;
    }

    await this.getLocationOrThrow(organizationId, locationId);
    return locationId;
  }

  private assertUniqueScope(locationIds: Array<string | undefined>): void {
    const normalizedLocationIds = [
      ...new Set(locationIds.map((locationId) => locationId ?? null)),
    ];

    if (normalizedLocationIds.length > 1) {
      throw new BadRequestException(
        'All records in a bulk request must use the same locationId',
      );
    }
  }

  private async assertNoBusinessHourOverlap(params: {
    organizationId: string;
    locationId?: string | null;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    excludeId?: string;
  }): Promise<void> {
    const existingHours =
      await this.schedulesRepository.findBusinessHoursForScope({
        organizationId: params.organizationId,
        locationId: params.locationId ?? null,
        dayOfWeek: params.dayOfWeek,
      });

    this.assertNoOverlaps([
      ...existingHours
        .filter((hour) => hour.id !== params.excludeId)
        .map((hour) => ({
          id: hour.id,
          dayOfWeek: hour.dayOfWeek,
          startTime: formatClockTime(hour.startTime),
          endTime: formatClockTime(hour.endTime),
        })),
      params,
    ]);
  }

  private async assertNoMemberScheduleOverlap(params: {
    organizationId: string;
    memberId: string;
    locationId?: string | null;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    excludeId?: string;
  }): Promise<void> {
    const existingSchedules =
      await this.schedulesRepository.findMemberSchedulesForScope({
        organizationId: params.organizationId,
        memberId: params.memberId,
        locationId: params.locationId ?? null,
        dayOfWeek: params.dayOfWeek,
      });

    this.assertNoOverlaps([
      ...existingSchedules
        .filter((schedule) => schedule.id !== params.excludeId)
        .map((schedule) => ({
          id: schedule.id,
          dayOfWeek: schedule.dayOfWeek,
          startTime: formatClockTime(schedule.startTime),
          endTime: formatClockTime(schedule.endTime),
        })),
      params,
    ]);
  }

  private assertNoOverlaps(windows: TimeWindow[]): void {
    const orderedWindows = [...windows].sort(
      (left, right) =>
        left.dayOfWeek - right.dayOfWeek ||
        clockTimeToMinutes(left.startTime) -
          clockTimeToMinutes(right.startTime),
    );

    orderedWindows.forEach((window) => {
      this.assertTimeWindow(window.startTime, window.endTime);
    });

    for (let index = 1; index < orderedWindows.length; index += 1) {
      const previous = orderedWindows[index - 1];
      const current = orderedWindows[index];

      if (
        previous.dayOfWeek === current.dayOfWeek &&
        clockTimeToMinutes(previous.endTime) >
          clockTimeToMinutes(current.startTime)
      ) {
        throw new ConflictException(
          'Schedule windows cannot overlap within the same day and scope',
        );
      }
    }
  }

  private assertTimeWindow(startTime: string, endTime: string): void {
    assertTimeRange(startTime, endTime);
  }

  private assertDateRange(dateFrom: string, dateTo: string): void {
    assertLocalDate(dateFrom);
    assertLocalDate(dateTo);

    if (dateFrom > dateTo) {
      throw new BadRequestException('dateFrom must be before or equal dateTo');
    }
  }

  private normalizeExceptionWindow(
    dto: CreateScheduleExceptionDto | UpdateScheduleExceptionDto,
  ): {
    startTime?: string;
    endTime?: string;
    isClosed: boolean;
  } {
    const isClosed = dto.isClosed ?? true;
    const hasStart = dto.startTime !== undefined;
    const hasEnd = dto.endTime !== undefined;

    if (hasStart !== hasEnd) {
      throw new BadRequestException(
        'startTime and endTime must be provided together',
      );
    }

    if (!isClosed && (!dto.startTime || !dto.endTime)) {
      throw new BadRequestException(
        'startTime and endTime are required for special opening exceptions',
      );
    }

    if (dto.startTime && dto.endTime) {
      this.assertTimeWindow(dto.startTime, dto.endTime);
    }

    return {
      startTime: dto.startTime,
      endTime: dto.endTime,
      isClosed,
    };
  }

  private normalizeTimezone(timezone?: string): string {
    const normalizedTimezone = timezone?.trim() || NICARAGUA_TIMEZONE;
    assertSupportedTimezone(normalizedTimezone);

    return normalizedTimezone;
  }

  private normalizeName(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  private getTodayInNicaragua(): string {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: NICARAGUA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    return `${year}-${month}-${day}`;
  }

  private mapLocation(location: ScheduleLocationRecord): LocationResponseDto {
    return {
      id: location.id,
      name: location.name,
      address: location.address,
      timezone: location.timezone ?? NICARAGUA_TIMEZONE,
      isActive: location.isActive,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    };
  }

  private mapBusinessHour(
    businessHour: ScheduleBusinessHourRecord,
  ): BusinessHourResponseDto {
    return {
      id: businessHour.id,
      location: businessHour.location
        ? this.mapLocation(businessHour.location)
        : null,
      dayOfWeek: businessHour.dayOfWeek,
      dayName: dayName(businessHour.dayOfWeek),
      startTime: formatClockTime(businessHour.startTime),
      endTime: formatClockTime(businessHour.endTime),
      isClosed: businessHour.isClosed,
      createdAt: businessHour.createdAt,
      updatedAt: businessHour.updatedAt,
    };
  }

  private mapException(
    exception: ScheduleExceptionRecord,
  ): ScheduleExceptionResponseDto {
    return {
      id: exception.id,
      location: exception.location
        ? this.mapLocation(exception.location)
        : null,
      date: formatLocalDate(exception.date),
      name: exception.name,
      startTime: exception.startTime
        ? formatClockTime(exception.startTime)
        : null,
      endTime: exception.endTime ? formatClockTime(exception.endTime) : null,
      isClosed: exception.isClosed,
      createdAt: exception.createdAt,
      updatedAt: exception.updatedAt,
    };
  }

  private mapExceptionAsBusinessHour(
    exception: ScheduleExceptionRecord,
    dayOfWeek: number,
  ): BusinessHourResponseDto {
    return {
      id: exception.id,
      location: exception.location
        ? this.mapLocation(exception.location)
        : null,
      dayOfWeek,
      dayName: dayName(dayOfWeek),
      startTime: formatClockTime(exception.startTime as Date),
      endTime: formatClockTime(exception.endTime as Date),
      isClosed: false,
      createdAt: exception.createdAt,
      updatedAt: exception.updatedAt,
    };
  }

  private mapMemberSchedule(
    schedule: ScheduleMemberScheduleRecord,
  ): MemberScheduleResponseDto {
    return {
      id: schedule.id,
      member: {
        id: schedule.member.id,
        email: schedule.member.user.email,
        firstName: schedule.member.user.firstName,
        lastName: schedule.member.user.lastName,
      },
      location: schedule.location ? this.mapLocation(schedule.location) : null,
      dayOfWeek: schedule.dayOfWeek,
      dayName: dayName(schedule.dayOfWeek),
      startTime: formatClockTime(schedule.startTime),
      endTime: formatClockTime(schedule.endTime),
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    };
  }

  private emitSchedulesEvent(params: {
    organizationId: string;
    resource: string;
    action: string;
    entityId?: string | null;
    data: unknown;
    invalidate: string[];
  }): void {
    this.realtimeService.publishOrganizationEvent({
      organizationId: params.organizationId,
      domain: 'schedules',
      resource: params.resource,
      action: params.action,
      entityId: params.entityId,
      data: params.data,
      invalidate: params.invalidate,
    });

    const notification = this.buildSchedulesNotification(params);

    void this.notificationsService
      .createDomainNotification({
        organizationId: params.organizationId,
        sourceDomain: 'schedules',
        sourceResource: params.resource,
        sourceAction: params.action,
        sourceEntityId: params.entityId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        payload: params.data,
      })
      .catch((error: unknown) => {
        this.logger.error(
          `Failed to persist schedules notification for ${params.resource}.${params.action}`,
          error instanceof Error ? error.stack : undefined,
        );
      });
  }

  private buildSchedulesNotification(params: {
    resource: string;
    action: string;
    data: unknown;
  }): {
    type: NotificationType;
    title: string;
    message: string;
  } {
    const record =
      params.data && typeof params.data === 'object'
        ? (params.data as Record<string, unknown>)
        : null;
    const locationName =
      typeof record?.name === 'string'
        ? record.name
        : typeof record?.dayName === 'string'
          ? record.dayName
          : typeof record?.member === 'object' && record.member
            ? this.resolveScheduleMemberName(record.member)
            : null;

    return {
      type: NotificationType.SYSTEM_MESSAGE,
      title: `${this.humanizeLabel(params.resource)} ${this.humanizeAction(params.action)}`,
      message: locationName
        ? `${this.humanizeLabel(params.resource)} ${locationName} was ${this.humanizeAction(params.action).toLowerCase()} in schedules.`
        : `Schedules ${this.humanizeLabel(params.resource).toLowerCase()} was ${this.humanizeAction(params.action).toLowerCase()} successfully.`,
    };
  }

  private resolveScheduleMemberName(value: unknown): string | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const firstName =
      typeof (value as Record<string, unknown>).firstName === 'string'
        ? (value as Record<string, unknown>).firstName
        : null;
    const lastName =
      typeof (value as Record<string, unknown>).lastName === 'string'
        ? (value as Record<string, unknown>).lastName
        : null;
    const name = [firstName, lastName].filter(Boolean).join(' ').trim();

    return name || null;
  }

  private humanizeLabel(value: string): string {
    return value
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private humanizeAction(value: string): string {
    return value
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
