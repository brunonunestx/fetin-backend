import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RequestContext } from '../context/request-context';

interface ErrorPayload {
  statusCode: number;
  code: string;
  message: string;
  correlationId?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = RequestContext.correlationId;

    const payload = this.buildPayload(exception, correlationId);

    if (payload.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${payload.statusCode} ${payload.code}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} -> ${payload.statusCode} ${payload.code}`,
      );
    }

    response.status(payload.statusCode).json(payload);
  }

  private buildPayload(
    exception: unknown,
    correlationId: string | undefined,
  ): ErrorPayload {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        return {
          statusCode: status,
          code: exception.name,
          message: exceptionResponse,
          correlationId,
        };
      }

      const responseObject = exceptionResponse as Record<string, unknown>;
      return {
        statusCode: status,
        code: (responseObject.code as string) ?? exception.name,
        message:
          (responseObject.message as string) ?? exception.message,
        correlationId,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      correlationId,
    };
  }
}
