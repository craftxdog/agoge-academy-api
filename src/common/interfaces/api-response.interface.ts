export type PaginationStrategy = 'cursor' | 'offset';

export type CursorPaginationMeta = {
  strategy: 'cursor';
  limit: number;
  count: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor: string | null;
  previousCursor: string | null;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
};

export type OffsetPaginationMeta = {
  strategy: 'offset';
  page: number;
  limit: number;
  count: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
};

export type PaginationMeta = CursorPaginationMeta | OffsetPaginationMeta;

export type PaginatedResult<T> = {
  items: T[];
  pagination: PaginationMeta;
  message?: string;
};

export type ApiRequestMeta = {
  requestId?: string;
  method: string;
  path: string;
  timestamp: string;
};

export type ApiTenantMeta = {
  organizationId?: string;
  organizationSlug?: string;
  memberId?: string;
};

export type ApiResponseMeta = {
  request: ApiRequestMeta;
  tenant?: ApiTenantMeta;
  pagination?: PaginationMeta;
};

export type ApiSuccessResponse<T> = {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta: ApiResponseMeta;
};

export type ApiErrorResponse = {
  success: false;
  statusCode: number;
  message: string | string[];
  error: string;
  meta: ApiResponseMeta;
};
