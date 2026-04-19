import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { TenantRequest } from '../interfaces/request-context.interface';
import {
  getOrganizationId,
  getOrganizationSlug,
  getRequestId,
} from '../utils/request-context.util';

type ApiResponse<T> = {
  success: true;
  data: T;
  timestamp: string;
  path: string;
  meta: {
    requestId?: string;
    method: string;
    organizationId?: string;
    organizationSlug?: string;
  };
};

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<TenantRequest>();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
        path: request.url,
        meta: {
          requestId: getRequestId(request),
          method: request.method,
          organizationId: getOrganizationId(request),
          organizationSlug: getOrganizationSlug(request),
        },
      })),
    );
  }
}
