import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { REQUEST_ID_HEADER } from '../constants/request-context.constant';
import { TenantRequest } from '../interfaces/request-context.interface';
import { resolveRequestId } from '../utils/request-id.util';
import {
  getCurrentMember,
  getCurrentOrganization,
  getCurrentUser,
  getRequestId,
} from '../utils/request-context.util';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<TenantRequest>();
    const response = http.getResponse<{
      setHeader: (key: string, value: string) => void;
    }>();
    const requestId = resolveRequestId(
      getRequestId(request) ?? request.headers[REQUEST_ID_HEADER],
    );

    request.requestId = requestId;
    request.tenant = {
      requestId,
      user: getCurrentUser(request),
      organization: getCurrentOrganization(request),
      member: getCurrentMember(request),
    };

    response.setHeader(REQUEST_ID_HEADER, requestId);

    return next.handle();
  }
}
