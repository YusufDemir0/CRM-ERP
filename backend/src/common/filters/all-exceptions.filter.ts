import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      message = typeof exResponse === 'string' ? exResponse : (exResponse as any).message || exResponse;
    } else if (exception instanceof QueryFailedError) {
      // SEC-01: Mask DB internal errors
      status = HttpStatus.BAD_REQUEST;
      message = 'Geçersiz işlem. Lütfen girdiğiniz bilgileri kontrol ediniz.';
      this.logger.error(`[DATABASE ERROR] ${exception.message}`, exception.stack);
    } else {
      // SEC-01: Mask unexpected errors and log details
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Sistem üzerinde beklenmedik bir hata oluştu. Teknik ekip bilgilendirildi.';
      const errorMessage = exception instanceof Error ? exception.message : 'Unknown error';
      const errorStack = exception instanceof Error ? exception.stack : '';
      this.logger.error(`[UNEXPECTED ERROR] ${errorMessage}`, errorStack);
    }

    const responseBody = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    };

    response.status(status).json(responseBody);
  }
}
