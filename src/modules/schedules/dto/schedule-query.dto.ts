import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class LocationQueryDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'central' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class BusinessHourQueryDto {
  @ApiPropertyOptional({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({
    description: '0 is Sunday and 6 is Saturday.',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;
}

export class ScheduleExceptionQueryDto {
  @ApiPropertyOptional({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ example: '2026-04-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-04-30' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class MemberScheduleQueryDto {
  @ApiPropertyOptional({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({
    description: '0 is Sunday and 6 is Saturday.',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;
}

export class DayScheduleQueryDto {
  @ApiPropertyOptional({ example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a' })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({
    description:
      'Local Nicaragua calendar date. Defaults to the current America/Managua day.',
    example: '2026-04-20',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
