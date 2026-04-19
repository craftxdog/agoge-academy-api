import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable } from 'rxjs';
import { REQUEST_ID_HEADER } from '../constants/request-context.constant';
import { TenantRequest } from '../interfaces/request-context.interface';
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
    const requestId = getRequestId(request) ?? randomUUID();

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
