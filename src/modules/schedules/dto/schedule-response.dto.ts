import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ example: 'Agoge Central Managua' })
  name: string;

  @ApiPropertyOptional({ example: 'Los Robles, Managua, Nicaragua' })
  address?: string | null;

  @ApiProperty({ example: 'America/Managua' })
  timezone: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  updatedAt: Date;
}

export class BusinessHourResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiPropertyOptional({ type: LocationResponseDto })
  location?: LocationResponseDto | null;

  @ApiProperty({ example: 1 })
  dayOfWeek: number;

  @ApiProperty({ example: 'monday' })
  dayName: string;

  @ApiProperty({ example: '06:00' })
  startTime: string;

  @ApiProperty({ example: '21:00' })
  endTime: string;

  @ApiProperty({ example: false })
  isClosed: boolean;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  updatedAt: Date;
}

export class ScheduleExceptionResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiPropertyOptional({ type: LocationResponseDto })
  location?: LocationResponseDto | null;

  @ApiProperty({ example: '2026-09-14' })
  date: string;

  @ApiProperty({ example: 'Batalla de San Jacinto' })
  name: string;

  @ApiPropertyOptional({ example: '08:00' })
  startTime?: string | null;

  @ApiPropertyOptional({ example: '12:00' })
  endTime?: string | null;

  @ApiProperty({ example: true })
  isClosed: boolean;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  updatedAt: Date;
}

export class ScheduleMemberSummaryDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ example: 'coach@agoge.com' })
  email: string;

  @ApiProperty({ example: 'Alex' })
  firstName: string;

  @ApiProperty({ example: 'Coach' })
  lastName: string;
}

export class MemberScheduleResponseDto {
  @ApiProperty({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  id: string;

  @ApiProperty({ type: ScheduleMemberSummaryDto })
  member: ScheduleMemberSummaryDto;

  @ApiPropertyOptional({ type: LocationResponseDto })
  location?: LocationResponseDto | null;

  @ApiProperty({ example: 1 })
  dayOfWeek: number;

  @ApiProperty({ example: 'monday' })
  dayName: string;

  @ApiProperty({ example: '06:00' })
  startTime: string;

  @ApiProperty({ example: '10:00' })
  endTime: string;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  updatedAt: Date;
}

export class DayScheduleResponseDto {
  @ApiProperty({ example: '2026-04-20' })
  date: string;

  @ApiProperty({ example: 1 })
  dayOfWeek: number;

  @ApiProperty({ example: 'monday' })
  dayName: string;

  @ApiProperty({ example: 'America/Managua' })
  timezone: string;

  @ApiPropertyOptional({ type: LocationResponseDto })
  location?: LocationResponseDto | null;

  @ApiProperty({ type: [BusinessHourResponseDto] })
  businessHours: BusinessHourResponseDto[];

  @ApiProperty({ type: [ScheduleExceptionResponseDto] })
  exceptions: ScheduleExceptionResponseDto[];

  @ApiProperty({ type: [MemberScheduleResponseDto] })
  memberSchedules: MemberScheduleResponseDto[];

  @ApiProperty({ example: true })
  isClosed: boolean;
}
