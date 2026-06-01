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
    const ipAddress = request.ip || request.headers['x-forwarded-for'] || null;

    if (userId) {
      this.cls.set('userId', userId);
    }
    if (username) {
      this.cls.set('username', username);
    }
    if (fullName) {
      this.cls.set('fullName', fullName);
    }
    if (ipAddress) {
      this.cls.set('ipAddress', ipAddress);
    }

    return next.handle();
  }
}
