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
    const request = ctx.getRequest<Request & { id?: string }>();
    const reqId = request.id || request.headers['x-request-id'] || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let clientMessage = 'Beklenmedik bir sistem hatası oluştu. Lütfen tekrar deneyiniz.';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      clientMessage = typeof res === 'string' ? res : (res as { message?: string }).message || clientMessage;
      errorCode = `HTTP_${status}`;
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      errorCode = (exception as { code?: string }).code || 'DB_ERROR';

      // Specific Database Error Handling
      switch (errorCode) {
        case 'ER_DUP_ENTRY':
        case '1062':
          clientMessage = 'Bu bilgi sistemde zaten mevcut. Lütfen benzersiz bir değer giriniz.';
          status = HttpStatus.CONFLICT;
          break;
        case 'ER_NO_REFERENCED_ROW_2':
        case '1452':
          clientMessage = 'İlişkili veri bulunamadı. Lütfen referans verdiğiniz kayıtların doğruluğunu kontrol ediniz.';
          break;
        case 'ER_ROW_IS_REFERENCED_2':
        case '1217':
        case '1451':
          clientMessage = 'Bu kayıt başka veriler tarafından kullanıldığı için silinemez veya güncellenemez.';
          break;
        default:
          clientMessage = 'Veritabanı işlemi sırasında bir hata oluştu.';
      }
      
      this.logger.error(`[DB_ERROR] ${errorCode}: ${exception.message} | reqId=${reqId}`);
    } else {
      const msg = exception instanceof Error ? exception.message : 'Unknown';
      this.logger.error(`[CRITICAL_UNHANDLED] ${msg} | reqId=${reqId}`, exception instanceof Error ? exception.stack : '');
    }

    const isProd = process.env.NODE_ENV === 'production';

    response.status(status).json({
      success: false,
      statusCode: status,
      errorCode,
      reqId,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: clientMessage,
      // Debug info only in non-production environments
      ...(!isProd && { debug: exception instanceof Error ? exception.message : String(exception) }),
    });
  }
}
