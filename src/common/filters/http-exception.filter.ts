import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { TenantRequest } from '../interfaces/request-context.interface';
import {
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

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: getRequestId(request),
      organizationId: getOrganizationId(request),
      organizationSlug: getOrganizationSlug(request),
      message: payload?.message ?? exceptionResponse ?? 'Internal server error',
      error: payload?.error ?? HttpStatus[status],
    });
  }
}
