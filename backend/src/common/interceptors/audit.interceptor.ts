import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClsService } from 'nestjs-cls';

/**
 * AuditInterceptor — Request'teki kullanıcı bilgisini ClsService'e (AsyncLocalStorage) koyar.
 * Bu sayede AuditSubscriber gibi yapılar kullanıcıyı her yerden okuyabilir.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub || request.user?.id || null;
    const username = request.user?.username || null;
    const fullName = request.user?.fullName || null;
    const forwarded = request.headers['x-forwarded-for'];
    let rawIp = '';
    if (typeof forwarded === 'string') {
      rawIp = forwarded.split(',')[0].trim();
    } else if (Array.isArray(forwarded)) {
      rawIp = forwarded[0];
    } else {
      rawIp = request.ip || request.socket?.remoteAddress || '127.0.0.1';
    }

    if (rawIp.startsWith('::ffff:')) {
      rawIp = rawIp.replace('::ffff:', '');
    }
    if (rawIp === '::1' || rawIp === '::') {
      rawIp = '127.0.0.1';
    }
    const ipAddress = rawIp || '127.0.0.1';

    if (userId) {
      this.cls.set('userId', userId);
    }
    if (username) {
      this.cls.set('username', username);
    }
    if (fullName) {
      this.cls.set('fullName', fullName);
    }
    this.cls.set('ipAddress', ipAddress);

    return next.handle();
  }
}
