import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { LogsService } from '../../modules/logs/logs.service';
export declare class LogsInterceptor implements NestInterceptor {
    private readonly logsService;
    private readonly logger;
    constructor(logsService: LogsService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
    private sanitizeBody;
    private saveLog;
}
