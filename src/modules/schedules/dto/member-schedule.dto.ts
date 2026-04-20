import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
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

export class CreateMemberScheduleDto {
  @ApiPropertyOptional({
    description:
      'When omitted, the availability applies regardless of location.',
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

  @ApiProperty({ example: '10:00' })
  @IsString()
  @Matches(TIME_PATTERN)
  endTime: string;
}

export class UpdateMemberScheduleDto {
  @ApiPropertyOptional({ example: '06:00' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN)
  startTime?: string;

  @ApiPropertyOptional({ example: '10:00' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN)
  endTime?: string;
}

export class ReplaceMemberSchedulesDto {
  @ApiProperty({ type: [CreateMemberScheduleDto] })
  @ValidateNested({ each: true })
  @Type(() => CreateMemberScheduleDto)
  schedules: CreateMemberScheduleDto[];
}
