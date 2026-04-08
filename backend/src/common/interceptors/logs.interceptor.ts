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

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    const loggableMethods = ['POST', 'PUT', 'DELETE'];
    if (!loggableMethods.includes(method)) {
      return next.handle();
    }

    // Skip logs & auth/login to avoid recursion and noise
    if (url.includes('/logs') || url.includes('/auth/login')) {
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

  private async saveLog(request: any, status: string, responseData: any) {
    try {
      const { method, url, user, ip, body } = request;

      const userId = user?.id || user?.sub || null;
      const username = user?.username || 'SYSTEM';
      const fullName = user?.fullName || user?.full_name || '';

      // Extract module from URL: /api/items/types → ITEMS
      const parts = url.replace(/^\/api\//, '').split('/');
      const moduleName = (parts[0] || 'SYSTEM').toUpperCase();
      const action = `${method} ${url}`;

      const cleanBody = { ...body };
      const sensitiveFields = ['password', 'token', 'access_token', 'secret', 'passwordHash'];
      sensitiveFields.forEach(f => {
        if (cleanBody[f]) cleanBody[f] = '********';
      });

      let responseSummary = 'OK';
      if (status === 'ERROR') {
        responseSummary =
          responseData?.message ||
          responseData?.response?.message ||
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
          body: Object.keys(cleanBody).length > 0 ? cleanBody : null,
          status,
          response: responseSummary,
        }),
        ipAddress: ip,
      });
    } catch (e) {
      // Never let logging failures break the request pipeline
      this.logger.error(`LogsInterceptor.saveLog crashed silently: ${e.message}`);
    }
  }
}
