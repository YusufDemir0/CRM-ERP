import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { LogsService } from '../../modules/logs/logs.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class LogsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LogsInterceptor.name);

  constructor(
    private readonly logsService: LogsService,
    private readonly cls: ClsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    const loggableMethods = ['POST', 'PUT', 'DELETE'];
    if (!loggableMethods.includes(method)) {
      return next.handle();
    }

    // Skip logs module to avoid recursion
    if (url.includes('/logs')) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        this.saveLog(request, 'SUCCESS', data, duration).catch(err =>
          this.logger.error(`Audit log failed: ${err.message}`),
        );
      }),
      catchError((err) => {
        const duration = Date.now() - startTime;
        this.saveLog(request, 'ERROR', err, duration).catch(e =>
          this.logger.error(`Audit error-log failed: ${e.message}`),
        );
        return throwError(() => err);
      }),
    );
  }

  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') return body;

    // SEC-01: Prevent Event Loop blocking if the body is too large
    // We roughly estimate the size before deep-redacting
    try {
      const estimatedSize = JSON.stringify(body).length;
      if (estimatedSize > 51200) { // 50KB limit for redaction processing
        return '[PAYLOAD_TOO_LARGE_FOR_REDACTION]';
      }
    } catch (e) {
      return '[CIRCULAR_STRUCTURE]';
    }

    const sensitiveKeys = ['password', 'token', 'secret', 'hash', 'iban', 'cc_', 'cvv', 'tax_number', 'tc_no', 'tcno'];
    
    try {
      const redactedStr = JSON.stringify(body, (key, value) => {
        if (typeof key === 'string' && sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
          return '********';
        }
        return value;
      });
      return JSON.parse(redactedStr);
    } catch (e) {
      return '[REDACTION_FAILED]';
    }
  }

  private async saveLog(request: import('express').Request & { user?: Record<string, unknown>, id?: string }, status: string, responseData: unknown, durationMs: number) {
    try {
      const { method, url, user, ip, body } = request;
      const cleanBody = body ? this.sanitizeBody(body) : null;
      const reqId = this.cls.get('reqId') || request.id;
      
      // Efficient payload size check
      let detailsBody = cleanBody;
      if (cleanBody) {
        const bodyStr = JSON.stringify(cleanBody);
        if (bodyStr.length > 5120) detailsBody = '[PAYLOAD_TOO_LARGE]';
      }

      let responseMsg = 'OK';
      if (status === 'ERROR') {
        const errObj = responseData as { message?: string, response?: { message?: string } };
        responseMsg = errObj?.message || errObj?.response?.message || String(responseData);
        if (responseMsg.length > 1000) responseMsg = responseMsg.substring(0, 1000) + '...';
      }

      await this.logsService.addLog({
        userId: String(user?.id || user?.sub || '0'),
        username: String(user?.username || 'SYSTEM'),
        fullName: String(user?.fullName || user?.full_name || ''),
        action: `${method} ${url}`,
        module: (url.replace(/^\/api\//, '').split('/')[0] || 'SYSTEM').toUpperCase(),
        tag: status,
        details: JSON.stringify({
          reqId,
          durationMs,
          body: detailsBody,
          status,
          response: responseMsg,
        }),
        ipAddress: ip,
      });
    } catch (e) {
      this.logger.error(`Audit log failed: ${e.message}`);
    }
  }
}
