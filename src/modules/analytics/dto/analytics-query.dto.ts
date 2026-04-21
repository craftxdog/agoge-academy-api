import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export const ANALYTICS_GROUP_BY_VALUES = ['day', 'week', 'month'] as const;
export type AnalyticsGroupBy = (typeof ANALYTICS_GROUP_BY_VALUES)[number];

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-04-30T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    enum: ANALYTICS_GROUP_BY_VALUES,
    default: 'day',
  })
  @IsOptional()
  @IsIn(ANALYTICS_GROUP_BY_VALUES)
  groupBy: AnalyticsGroupBy = 'day';

  @ApiPropertyOptional({
    description: 'Maximum number of top dimensions returned by the endpoint.',
    minimum: 1,
    maximum: 10,
    default: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  top: number = 5;
}
