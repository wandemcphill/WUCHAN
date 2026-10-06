import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '@wuchan/contracts';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let errorCode = 'INTERNAL_ERROR';
    let message = 'An unexpected internal error occurred.';
    let details: any = null;

    if (status === HttpStatus.UNAUTHORIZED) {
      errorCode = 'UNAUTHORIZED';
      message = 'Authentication credentials are missing or invalid.';
    } else if (status === HttpStatus.FORBIDDEN) {
      errorCode = 'PERMISSION_DENIED';
      message = 'You do not have permission to perform this operation.';
    } else if (status === HttpStatus.BAD_REQUEST) {
      errorCode = 'VALIDATION_ERROR';
      message = 'Invalid request parameters.';
    } else if (status === HttpStatus.NOT_FOUND) {
      errorCode = 'RESOURCE_NOT_FOUND';
      message = 'The requested resource was not found.';
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resObj = exceptionResponse as Record<string, any>;
      if (resObj.message) {
        message = Array.isArray(resObj.message)
          ? resObj.message.join(', ')
          : resObj.message;
      }
      if (resObj.error) {
        errorCode = resObj.error.toUpperCase().replace(/\s+/g, '_');
      }
      details = resObj.details || null;
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception)
      );
    }

    const payload: ApiResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        details
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (request.headers['x-request-id'] as string) || undefined
      }
    };

    response.status(status).json(payload);
  }
}
