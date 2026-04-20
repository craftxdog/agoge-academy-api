import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TIME_PATTERN } from '../utils/schedule-time.util';

export class CreateBusinessHourDto {
  @ApiPropertyOptional({
    description:
      'When omitted, the rule applies at organization level. Use locationId for branch-specific hours.',
    example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a',
  })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty({
    description: '0 is Sunday and 6 is Saturday.',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '06:00' })
  @IsString()
  @Matches(TIME_PATTERN)
  startTime: string;

  @ApiProperty({ example: '21:00' })
  @IsString()
  @Matches(TIME_PATTERN)
  endTime: string;

  @ApiPropertyOptional({
    description:
      'Use exceptions for full-day closures. This flag is for closed intervals inside an otherwise open day.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;
}

export class UpdateBusinessHourDto {
  @ApiPropertyOptional({ example: '06:00' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN)
  startTime?: string;

  @ApiPropertyOptional({ example: '21:00' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN)
  endTime?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;
}

export class UpsertBusinessHoursDto {
  @ApiProperty({
    type: [CreateBusinessHourDto],
    description:
      'Replaces the weekly business-hour rules for the provided location scope.',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateBusinessHourDto)
  hours: CreateBusinessHourDto[];
}
