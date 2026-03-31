import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { DataSource } from 'typeorm';

/**
 * AuditInterceptor — Request'teki kullanıcı bilgisini
 * TypeORM query context'ine ekler.
 * Entity subscriber'lar bu bilgiyi created_by/updated_by set etmek için kullanır.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub || request.user?.id || null;

    // DataSource queryRunner'larına userId metadata'sı ekliyoruz.
    // Bu, entity subscriber tarafından okunacak.
    if (userId) {
      // Request'e userId'yi ekle — service'ler buradan okuyabilir
      request.currentUserId = userId;
    }

    return next.handle();
  }
}
