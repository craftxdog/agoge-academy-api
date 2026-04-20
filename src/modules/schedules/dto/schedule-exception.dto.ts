import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { TIME_PATTERN } from '../utils/schedule-time.util';

export class CreateScheduleExceptionDto {
  @ApiPropertyOptional({
    description:
      'When omitted, the exception applies at organization level. Use locationId for branch-specific closures or special hours.',
    example: '7ce9fdf3-9555-4f43-a676-390bd78dbe6a',
  })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty({
    description: 'Local Nicaragua calendar date.',
    example: '2026-09-14',
  })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Batalla de San Jacinto' })
  @IsString()
  @MaxLength(160)
  name: string;

  @ApiPropertyOptional({
    description:
      'Required when isClosed is false. Optional for partial closure windows.',
    example: '08:00',
  })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN)
  startTime?: string;

  @ApiPropertyOptional({
    description:
      'Required when isClosed is false. Optional for partial closure windows.',
    example: '12:00',
  })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN)
  endTime?: string;

  @ApiPropertyOptional({
    description:
      'true closes the full day or a partial interval. false defines special opening hours.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;
}

export class UpdateScheduleExceptionDto {
  @ApiPropertyOptional({ example: 'Batalla de San Jacinto' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN)
  startTime?: string;

  @ApiPropertyOptional({ example: '12:00' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN)
  endTime?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;
}
