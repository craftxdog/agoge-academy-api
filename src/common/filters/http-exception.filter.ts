import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
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

type PrismaKnownRequestError = {
  code: string;
  clientVersion?: string;
  meta?: unknown;
};

type PrismaHttpPayload = {
  status: HttpStatus;
  message: string;
  error: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<TenantRequest>();
    const prismaPayload = this.getPrismaHttpPayload(exception);

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : prismaPayload?.status
          ? prismaPayload.status
          : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const payload =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as ErrorResponse)
        : undefined;
    const message =
      prismaPayload?.message ??
      payload?.message ??
      (typeof exceptionResponse === 'string'
        ? exceptionResponse
        : 'Internal server error');
    const error = prismaPayload?.error ?? payload?.error ?? HttpStatus[status];

    if (!(exception instanceof HttpException) || status >= 500) {
      this.logInternalError(exception, request, status);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      error,
      meta: this.buildMeta(request),
    } satisfies ApiErrorResponse);
  }

  private getPrismaHttpPayload(
    exception: unknown,
  ): PrismaHttpPayload | undefined {
    if (!this.isPrismaKnownRequestError(exception)) {
      return undefined;
    }

    if (exception.code === 'P2002') {
      return {
        status: HttpStatus.CONFLICT,
        message: 'Resource already exists',
        error: 'CONFLICT',
      };
    }

    if (exception.code === 'P2021' || exception.code === 'P2022') {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message:
          'Database schema is not ready. Run Prisma migrations before retrying.',
        error: 'DATABASE_SCHEMA_MISMATCH',
      };
    }

    if (['P1000', 'P1001', 'P1002', 'P1008'].includes(exception.code)) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message:
          'Database is not available. Check DATABASE_URL and connectivity.',
        error: 'DATABASE_UNAVAILABLE',
      };
    }

    return undefined;
  }

  private isPrismaKnownRequestError(
    exception: unknown,
  ): exception is PrismaKnownRequestError {
    if (!exception || typeof exception !== 'object') {
      return false;
    }

    const maybeError = exception as Partial<PrismaKnownRequestError>;

    return (
      typeof maybeError.code === 'string' && maybeError.code.startsWith('P')
    );
  }

  private logInternalError(
    exception: unknown,
    request: TenantRequest,
    status: number,
  ): void {
    const requestId = getRequestId(request) ?? 'unknown';
    const error = exception instanceof Error ? exception.stack : undefined;
    const details =
      exception instanceof Error
        ? exception.message
        : this.stringifyUnknownException(exception);
    const prismaDetails = this.isPrismaKnownRequestError(exception)
      ? ` Prisma code=${exception.code} meta=${this.stringifyUnknownException(exception.meta)}`
      : '';

    this.logger.error(
      `${request.method} ${request.url} failed with ${status} [requestId=${requestId}]: ${details}${prismaDetails}`,
      error,
    );
  }

  private stringifyUnknownException(exception: unknown): string {
    try {
      return JSON.stringify(exception);
    } catch {
      return String(exception);
    }
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
