import { BadRequestException } from '@nestjs/common';

export const NICARAGUA_TIMEZONE = 'America/Managua';
export const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export type DayName = (typeof DAY_NAMES)[number];

export function assertSupportedTimezone(timezone: string): void {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
  } catch {
    throw new BadRequestException('timezone must be a valid IANA timezone');
  }
}

export function parseClockTime(value: string): Date {
  if (!TIME_PATTERN.test(value)) {
    throw new BadRequestException('time must use HH:mm 24-hour format');
  }

  return new Date(`1970-01-01T${value}:00.000Z`);
}

export function formatClockTime(value: Date): string {
  return value.toISOString().slice(11, 16);
}

export function clockTimeToMinutes(value: string): number {
  if (!TIME_PATTERN.test(value)) {
    throw new BadRequestException('time must use HH:mm 24-hour format');
  }

  const [hours, minutes] = value.split(':').map(Number);

  return hours * 60 + minutes;
}

export function assertTimeRange(startTime: string, endTime: string): void {
  if (clockTimeToMinutes(startTime) >= clockTimeToMinutes(endTime)) {
    throw new BadRequestException('startTime must be earlier than endTime');
  }
}

export function assertLocalDate(value: string): void {
  if (!DATE_PATTERN.test(value)) {
    throw new BadRequestException('date must use YYYY-MM-DD format');
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new BadRequestException('date must be a valid calendar date');
  }
}

export function parseLocalDate(value: string): Date {
  assertLocalDate(value);
  return new Date(`${value}T00:00:00.000Z`);
}

export function getLocalDayOfWeek(value: string): number {
  assertLocalDate(value);
  const [year, month, day] = value.split('-').map(Number);

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
}

export function formatLocalDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function dayName(dayOfWeek: number): DayName {
  return DAY_NAMES[dayOfWeek] ?? DAY_NAMES[0];
}
