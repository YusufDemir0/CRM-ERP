import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CsrfInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest();

    let token = request.cookies['XSRF-TOKEN'];
    
    if (!token) {
      token = uuidv4();
      response.cookie('XSRF-TOKEN', token, {
        httpOnly: true, // SEC-03: Protect against XSS
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });
    }

    // Her durumda header'da gönder ki frontend alabilsin (özellikle SPA refresh sonrası)
    response.setHeader('X-CSRF-TOKEN', token);

    return next.handle();
  }
}
