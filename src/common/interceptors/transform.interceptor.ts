import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, map } from 'rxjs';
import {
  ApiResponseMeta,
  ApiSuccessResponse,
  PaginatedResult,
} from '../interfaces';
import { TenantRequest } from '../interfaces/request-context.interface';
import { isPaginatedResult } from '../utils/pagination.util';
import {
  getMemberId,
  getOrganizationId,
  getOrganizationSlug,
  getRequestId,
} from '../utils/request-context.util';

const DEFAULT_SUCCESS_MESSAGE = 'Request completed successfully';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T | PaginatedResult<T>,
  ApiSuccessResponse<T | T[]>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T | PaginatedResult<T>>,
  ): Observable<ApiSuccessResponse<T | T[]>> {
    const http = context.switchToHttp();
    const request = http.getRequest<TenantRequest>();
    const response = http.getResponse<Response>();

    return next.handle().pipe(
      map((payload) => {
        const paginated = isPaginatedResult<T>(payload);
        const data = paginated ? payload.items : payload;
        const message = paginated
          ? (payload.message ?? DEFAULT_SUCCESS_MESSAGE)
          : DEFAULT_SUCCESS_MESSAGE;

        return {
          success: true,
          statusCode: response.statusCode || HttpStatus.OK,
          message,
          data,
          meta: this.buildMeta(request, paginated ? payload : undefined),
        };
      }),
    );
  }

  private buildMeta(
    request: TenantRequest,
    paginated?: PaginatedResult<T>,
  ): ApiResponseMeta {
    const organizationId = getOrganizationId(request);
    const organizationSlug = getOrganizationSlug(request);
    const memberId = getMemberId(request);
    const tenant =
      organizationId || organizationSlug || memberId
        ? { organizationId, organizationSlug, memberId }
        : undefined;

    return {
      request: {
        requestId: getRequestId(request),
        method: request.method,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
      tenant,
      ...(paginated && { pagination: paginated.pagination }),
    };
  }
}
