import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';
export declare class AuditInterceptor implements NestInterceptor {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
