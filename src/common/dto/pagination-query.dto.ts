import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const DEFAULT_CURSOR_LIMIT = 50;
export const MAX_CURSOR_LIMIT = 100;
export const DEFAULT_OFFSET_PAGE = 1;
export const DEFAULT_OFFSET_LIMIT = 25;
export const MAX_OFFSET_LIMIT = 100;

export type SortDirection = 'asc' | 'desc';

/**
 * Preferred pagination DTO for high-volume endpoints.
 *
 * Cursor pagination stays stable for large tables because it avoids deep OFFSET
 * scans and keeps pagination anchored to a known record.
 */
export class CursorPaginationQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_CURSOR_LIMIT)
  limit: number = DEFAULT_CURSOR_LIMIT;

  @IsOptional()
  @IsString()
  sortBy: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection: SortDirection = 'desc';
}

/**
 * Offset pagination is useful for small admin grids, but cursor pagination
 * should be the default for growing SaaS data.
 */
export class OffsetPaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = DEFAULT_OFFSET_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_OFFSET_LIMIT)
  limit: number = DEFAULT_OFFSET_LIMIT;

  @IsOptional()
  @IsString()
  sortBy: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection: SortDirection = 'desc';
}
