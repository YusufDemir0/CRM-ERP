import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { LogsService } from '../../modules/logs/logs.service';
import { ClsService } from 'nestjs-cls';
export declare class LogsInterceptor implements NestInterceptor {
    private readonly logsService;
    private readonly cls;
    private readonly logger;
    constructor(logsService: LogsService, cls: ClsService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
    private sanitizeBody;
    private saveLog;
}
