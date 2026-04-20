import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { MemberStatus } from 'generated/prisma/enums';
import { PrismaService } from '../../../database/prisma.service';
import {
  BusinessHourQueryDto,
  LocationQueryDto,
  MemberScheduleQueryDto,
  ScheduleExceptionQueryDto,
} from '../dto';

const locationOrderBy = [
  { isActive: 'desc' },
  { name: 'asc' },
] satisfies Prisma.LocationOrderByWithRelationInput[];

const businessHourInclude = {
  location: true,
} satisfies Prisma.BusinessHourInclude;

const exceptionInclude = {
  location: true,
} satisfies Prisma.ScheduleExceptionInclude;

const memberScheduleInclude = {
  member: {
    include: {
      user: true,
    },
  },
  location: true,
} satisfies Prisma.MemberScheduleInclude;

export type ScheduleLocationRecord = Prisma.LocationGetPayload<object>;
export type ScheduleBusinessHourRecord = Prisma.BusinessHourGetPayload<{
  include: typeof businessHourInclude;
}>;
export type ScheduleExceptionRecord = Prisma.ScheduleExceptionGetPayload<{
  include: typeof exceptionInclude;
}>;
export type ScheduleMemberScheduleRecord = Prisma.MemberScheduleGetPayload<{
  include: typeof memberScheduleInclude;
}>;
export type ScheduleMemberRecord = Prisma.OrganizationMemberGetPayload<{
  include: { user: true };
}>;

@Injectable()
export class SchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLocations(
    organizationId: string,
    query: LocationQueryDto,
  ): Promise<ScheduleLocationRecord[]> {
    return this.prisma.location.findMany({
      where: {
        organizationId,
        ...(query.isActive !== undefined && { isActive: query.isActive }),
        ...(query.search && {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { address: { contains: query.search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: locationOrderBy,
    });
  }

  findLocationById(
    organizationId: string,
    locationId: string,
  ): Promise<ScheduleLocationRecord | null> {
    return this.prisma.location.findFirst({
      where: { id: locationId, organizationId },
    });
  }

  findLocationByName(
    organizationId: string,
    name: string,
  ): Promise<ScheduleLocationRecord | null> {
    return this.prisma.location.findFirst({
      where: { organizationId, name },
    });
  }

  createLocation(params: {
    organizationId: string;
    name: string;
    address?: string;
    timezone: string;
    isActive?: boolean;
  }): Promise<ScheduleLocationRecord> {
    return this.prisma.location.create({
      data: {
        organizationId: params.organizationId,
        name: params.name,
        address: params.address,
        timezone: params.timezone,
        isActive: params.isActive,
      },
    });
  }

  updateLocation(params: {
    organizationId: string;
    id: string;
    name?: string;
    address?: string | null;
    timezone?: string;
    isActive?: boolean;
  }): Promise<ScheduleLocationRecord> {
    return this.prisma.location.update({
      where: { id: params.id, organizationId: params.organizationId },
      data: {
        name: params.name,
        address: params.address,
        timezone: params.timezone,
        isActive: params.isActive,
      },
    });
  }

  async locationHasScheduleData(
    organizationId: string,
    locationId: string,
  ): Promise<boolean> {
    const [businessHours, exceptions, memberSchedules] = await Promise.all([
      this.prisma.businessHour.count({
        where: { organizationId, locationId },
      }),
      this.prisma.scheduleException.count({
        where: { organizationId, locationId },
      }),
      this.prisma.memberSchedule.count({
        where: {
          locationId,
          member: { organizationId },
        },
      }),
    ]);

    return businessHours + exceptions + memberSchedules > 0;
  }

  deleteLocation(
    organizationId: string,
    locationId: string,
  ): Promise<ScheduleLocationRecord> {
    return this.prisma.location.delete({
      where: { id: locationId, organizationId },
    });
  }

  findBusinessHours(
    organizationId: string,
    query: BusinessHourQueryDto,
  ): Promise<ScheduleBusinessHourRecord[]> {
    return this.prisma.businessHour.findMany({
      where: {
        organizationId,
        ...(query.locationId !== undefined && {
          locationId: query.locationId,
        }),
        ...(query.dayOfWeek !== undefined && {
          dayOfWeek: query.dayOfWeek,
        }),
      },
      include: businessHourInclude,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  findBusinessHoursForScope(params: {
    organizationId: string;
    locationId?: string | null;
    dayOfWeek?: number;
  }): Promise<ScheduleBusinessHourRecord[]> {
    return this.prisma.businessHour.findMany({
      where: {
        organizationId: params.organizationId,
        locationId: params.locationId ?? null,
        ...(params.dayOfWeek !== undefined && { dayOfWeek: params.dayOfWeek }),
      },
      include: businessHourInclude,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  findBusinessHourById(
    organizationId: string,
    businessHourId: string,
  ): Promise<ScheduleBusinessHourRecord | null> {
    return this.prisma.businessHour.findFirst({
      where: { id: businessHourId, organizationId },
      include: businessHourInclude,
    });
  }

  createBusinessHour(params: {
    organizationId: string;
    locationId?: string | null;
    dayOfWeek: number;
    startTime: Date;
    endTime: Date;
    isClosed?: boolean;
  }): Promise<ScheduleBusinessHourRecord> {
    return this.prisma.businessHour.create({
      data: {
        organizationId: params.organizationId,
        locationId: params.locationId,
        dayOfWeek: params.dayOfWeek,
        startTime: params.startTime,
        endTime: params.endTime,
        isClosed: params.isClosed,
      },
      include: businessHourInclude,
    });
  }

  updateBusinessHour(params: {
    organizationId: string;
    id: string;
    startTime?: Date;
    endTime?: Date;
    isClosed?: boolean;
  }): Promise<ScheduleBusinessHourRecord> {
    return this.prisma.businessHour.update({
      where: { id: params.id, organizationId: params.organizationId },
      data: {
        startTime: params.startTime,
        endTime: params.endTime,
        isClosed: params.isClosed,
      },
      include: businessHourInclude,
    });
  }

  deleteBusinessHour(
    organizationId: string,
    businessHourId: string,
  ): Promise<ScheduleBusinessHourRecord> {
    return this.prisma.businessHour.delete({
      where: { id: businessHourId, organizationId },
      include: businessHourInclude,
    });
  }

  async replaceBusinessHoursForScope(params: {
    organizationId: string;
    locationId?: string | null;
    hours: Array<{
      dayOfWeek: number;
      startTime: Date;
      endTime: Date;
      isClosed?: boolean;
    }>;
  }): Promise<ScheduleBusinessHourRecord[]> {
    await this.prisma.$transaction(async (tx) => {
      await tx.businessHour.deleteMany({
        where: {
          organizationId: params.organizationId,
          locationId: params.locationId ?? null,
        },
      });

      if (params.hours.length > 0) {
        await tx.businessHour.createMany({
          data: params.hours.map((hour) => ({
            organizationId: params.organizationId,
            locationId: params.locationId ?? null,
            dayOfWeek: hour.dayOfWeek,
            startTime: hour.startTime,
            endTime: hour.endTime,
            isClosed: hour.isClosed,
          })),
        });
      }
    });

    return this.findBusinessHoursForScope({
      organizationId: params.organizationId,
      locationId: params.locationId,
    });
  }

  findExceptions(
    organizationId: string,
    query: ScheduleExceptionQueryDto,
  ): Promise<ScheduleExceptionRecord[]> {
    return this.prisma.scheduleException.findMany({
      where: {
        organizationId,
        ...(query.locationId !== undefined && {
          locationId: query.locationId,
        }),
        ...((query.dateFrom || query.dateTo) && {
          date: {
            ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
            ...(query.dateTo && { lte: new Date(query.dateTo) }),
          },
        }),
      },
      include: exceptionInclude,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }, { name: 'asc' }],
    });
  }

  findExceptionsForDate(params: {
    organizationId: string;
    locationId?: string | null;
    date: Date;
  }): Promise<ScheduleExceptionRecord[]> {
    return this.prisma.scheduleException.findMany({
      where: {
        organizationId: params.organizationId,
        date: params.date,
        OR: [{ locationId: null }, { locationId: params.locationId ?? null }],
      },
      include: exceptionInclude,
      orderBy: [{ locationId: 'asc' }, { startTime: 'asc' }, { name: 'asc' }],
    });
  }

  findExceptionById(
    organizationId: string,
    exceptionId: string,
  ): Promise<ScheduleExceptionRecord | null> {
    return this.prisma.scheduleException.findFirst({
      where: { id: exceptionId, organizationId },
      include: exceptionInclude,
    });
  }

  createException(params: {
    organizationId: string;
    locationId?: string | null;
    date: Date;
    name: string;
    startTime?: Date | null;
    endTime?: Date | null;
    isClosed?: boolean;
  }): Promise<ScheduleExceptionRecord> {
    return this.prisma.scheduleException.create({
      data: {
        organizationId: params.organizationId,
        locationId: params.locationId,
        date: params.date,
        name: params.name,
        startTime: params.startTime,
        endTime: params.endTime,
        isClosed: params.isClosed,
      },
      include: exceptionInclude,
    });
  }

  updateException(params: {
    organizationId: string;
    id: string;
    name?: string;
    startTime?: Date | null;
    endTime?: Date | null;
    isClosed?: boolean;
  }): Promise<ScheduleExceptionRecord> {
    return this.prisma.scheduleException.update({
      where: { id: params.id, organizationId: params.organizationId },
      data: {
        name: params.name,
        startTime: params.startTime,
        endTime: params.endTime,
        isClosed: params.isClosed,
      },
      include: exceptionInclude,
    });
  }

  deleteException(
    organizationId: string,
    exceptionId: string,
  ): Promise<ScheduleExceptionRecord> {
    return this.prisma.scheduleException.delete({
      where: { id: exceptionId, organizationId },
      include: exceptionInclude,
    });
  }

  findMember(
    organizationId: string,
    memberId: string,
  ): Promise<ScheduleMemberRecord | null> {
    return this.prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId,
        deletedAt: null,
        status: { not: MemberStatus.REMOVED },
      },
      include: { user: true },
    });
  }

  findMemberSchedules(
    organizationId: string,
    memberId: string,
    query: MemberScheduleQueryDto,
  ): Promise<ScheduleMemberScheduleRecord[]> {
    return this.prisma.memberSchedule.findMany({
      where: {
        memberId,
        member: { organizationId },
        ...(query.locationId !== undefined && {
          locationId: query.locationId,
        }),
        ...(query.dayOfWeek !== undefined && {
          dayOfWeek: query.dayOfWeek,
        }),
      },
      include: memberScheduleInclude,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  findMemberSchedulesForDay(params: {
    organizationId: string;
    locationId?: string | null;
    dayOfWeek: number;
  }): Promise<ScheduleMemberScheduleRecord[]> {
    return this.prisma.memberSchedule.findMany({
      where: {
        dayOfWeek: params.dayOfWeek,
        member: {
          organizationId: params.organizationId,
          deletedAt: null,
          status: { not: MemberStatus.REMOVED },
        },
        OR: [{ locationId: null }, { locationId: params.locationId ?? null }],
      },
      include: memberScheduleInclude,
      orderBy: [
        { locationId: 'asc' },
        { startTime: 'asc' },
        { member: { user: { firstName: 'asc' } } },
      ],
    });
  }

  findMemberScheduleById(
    organizationId: string,
    scheduleId: string,
  ): Promise<ScheduleMemberScheduleRecord | null> {
    return this.prisma.memberSchedule.findFirst({
      where: {
        id: scheduleId,
        member: { organizationId },
      },
      include: memberScheduleInclude,
    });
  }

  findMemberSchedulesForScope(params: {
    organizationId: string;
    memberId: string;
    locationId?: string | null;
    dayOfWeek?: number;
  }): Promise<ScheduleMemberScheduleRecord[]> {
    return this.prisma.memberSchedule.findMany({
      where: {
        memberId: params.memberId,
        member: { organizationId: params.organizationId },
        locationId: params.locationId ?? null,
        ...(params.dayOfWeek !== undefined && { dayOfWeek: params.dayOfWeek }),
      },
      include: memberScheduleInclude,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  createMemberSchedule(params: {
    memberId: string;
    locationId?: string | null;
    dayOfWeek: number;
    startTime: Date;
    endTime: Date;
  }): Promise<ScheduleMemberScheduleRecord> {
    return this.prisma.memberSchedule.create({
      data: {
        memberId: params.memberId,
        locationId: params.locationId,
        dayOfWeek: params.dayOfWeek,
        startTime: params.startTime,
        endTime: params.endTime,
      },
      include: memberScheduleInclude,
    });
  }

  updateMemberSchedule(params: {
    organizationId: string;
    id: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<ScheduleMemberScheduleRecord> {
    return this.prisma.memberSchedule.update({
      where: { id: params.id },
      data: {
        startTime: params.startTime,
        endTime: params.endTime,
      },
      include: memberScheduleInclude,
    });
  }

  deleteMemberSchedule(
    scheduleId: string,
  ): Promise<ScheduleMemberScheduleRecord> {
    return this.prisma.memberSchedule.delete({
      where: { id: scheduleId },
      include: memberScheduleInclude,
    });
  }

  async replaceMemberSchedules(params: {
    organizationId: string;
    memberId: string;
    schedules: Array<{
      locationId?: string | null;
      dayOfWeek: number;
      startTime: Date;
      endTime: Date;
    }>;
  }): Promise<ScheduleMemberScheduleRecord[]> {
    await this.prisma.$transaction(async (tx) => {
      await tx.memberSchedule.deleteMany({
        where: {
          memberId: params.memberId,
          member: { organizationId: params.organizationId },
        },
      });

      if (params.schedules.length > 0) {
        await tx.memberSchedule.createMany({
          data: params.schedules.map((schedule) => ({
            memberId: params.memberId,
            locationId: schedule.locationId ?? null,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          })),
        });
      }
    });

    return this.findMemberSchedules(params.organizationId, params.memberId, {});
  }
}
