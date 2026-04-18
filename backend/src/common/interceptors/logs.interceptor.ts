import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { LogsService } from '../../modules/logs/logs.service';

@Injectable()
export class LogsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LogsInterceptor.name);

  constructor(private readonly logsService: LogsService) {}

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

    return next.handle().pipe(
      tap((data) => {
        this.saveLog(request, 'SUCCESS', data).catch(err =>
          this.logger.error(`Audit log failed: ${err.message}`),
        );
      }),
      catchError((err) => {
        this.saveLog(request, 'ERROR', err).catch(e =>
          this.logger.error(`Audit error-log failed: ${e.message}`),
        );
        return throwError(() => err);
      }),
    );
  }

  private sanitizeBody(body: Record<string, unknown> | null | undefined, depth = 0): unknown {
    // ARCH-02: Tight depth limit (max 2) and flat logic for performance
    if (depth > 1) return '[NESTED_CONTENT_TRUNCATED]';
    if (!body || typeof body !== 'object') return body;
    if (Array.isArray(body)) return body.map(item => this.sanitizeBody(item, depth + 1));

    const sanitized = { ...body };
    const sensitiveFields = [
      'password', 'token', 'access_token', 'secret', 'passwordHash',
      'taxNumber', 'tax_number', 'tc_no', 'tckn', 'iban', 'cc_number', 'cvv'
    ];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '********';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeBody(sanitized[key] as Record<string, unknown>, depth + 1);
      }
    }
    return sanitized;
  }

  private async saveLog(request: { method: string, url: string, user?: { id?: number, sub?: number, username?: string, fullName?: string, full_name?: string }, ip?: string, body?: unknown }, status: string, responseData: unknown) {
    try {
      const { method, url, user, ip, body } = request;

      const userId = user?.id || user?.sub || undefined;
      const username = user?.username || 'SYSTEM';
      const fullName = user?.fullName || user?.full_name || '';

      const parts = url.replace(/^\/api\//, '').split('/');
      const moduleName = (parts[0] || 'SYSTEM').toUpperCase();
      const action = `${method} ${url}`;

      const cleanBody = this.sanitizeBody(body as Record<string, unknown>);

      let responseSummary = 'OK';
      if (status === 'ERROR') {
        const errorData = responseData as { message?: string, response?: { message?: string } } | undefined;
        responseSummary =
          errorData?.message ||
          errorData?.response?.message ||
          String(responseData) ||
          'REQUEST_FAILED';
      }

      await this.logsService.addLog({
        userId,
        username,
        fullName,
        action,
        module: moduleName,
        tag: status,
        details: JSON.stringify({
          body: cleanBody && Object.keys(cleanBody).length > 0 ? (JSON.stringify(cleanBody).length > 5120 ? '[PAYLOAD_TOO_LARGE]' : cleanBody) : null,
          status,
          response: typeof responseSummary === 'string' && responseSummary.length > 1000 ? responseSummary.substring(0, 1000) + '...' : responseSummary,
        }),
        ipAddress: ip,
      });
    } catch (e) {
      this.logger.error(`LogsInterceptor.saveLog crashed silently: ${e.message}`);
    }
  }
}
