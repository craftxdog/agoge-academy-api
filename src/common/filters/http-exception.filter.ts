import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiErrorResponse, ApiResponseMeta } from '../interfaces';
import { TenantRequest } from '../interfaces/request-context.interface';
import {
  getMemberId,
  getOrganizationId,
  getOrganizationSlug,
  getRequestId,
} from '../utils/request-context.util';

type ErrorResponse = {
  message?: string | string[];
  error?: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<TenantRequest>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const payload =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as ErrorResponse)
        : undefined;
    const message =
      payload?.message ??
      (typeof exceptionResponse === 'string'
        ? exceptionResponse
        : 'Internal server error');

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      error: payload?.error ?? HttpStatus[status],
      meta: this.buildMeta(request),
    } satisfies ApiErrorResponse);
  }

  private buildMeta(request: TenantRequest): ApiResponseMeta {
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
    };
  }
}
