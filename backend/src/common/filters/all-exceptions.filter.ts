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
  private readonly isProd = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let clientMessage = 'Beklenmedik bir sistem hatası oluştu. Lütfen tekrar deneyiniz.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      if (status < 500) {
        const res = exception.getResponse();
        clientMessage = typeof res === 'string' ? res : (res as { message?: string }).message || clientMessage;
      }
      // 500 HTTP hataları için soyut mesaj korunur
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      clientMessage = 'Veri işleme hatası. Girdiğiniz bilgilerin benzersizliğini ve geçerliliğini kontrol ediniz.';
      this.logger.error('[DB_ERROR_MASKED]', exception.message, exception.stack);
    } else {
      const msg = exception instanceof Error ? exception.message : 'Unknown';
      this.logger.error('[CRITICAL_UNHANDLED]', msg, exception instanceof Error ? exception.stack : '');
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: clientMessage,
      // Prod'da debug bilgisi KESİNLİKLE gönderilmez
      ...((!this.isProd) && { debug: exception instanceof Error ? exception.message : String(exception) }),
    });
  }
}
