import { LogsService } from './logs.service';
import { LogsQueryDto } from './dto/logs-query.dto';
export declare class LogsController {
    private readonly logsService;
    constructor(logsService: LogsService);
    findAll(query: LogsQueryDto): Promise<{
        data: import("./entities/log.entity").SystemLog[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getNotifications(): Promise<import("./entities/log.entity").SystemLog[]>;
    markAsRead(id: string): Promise<void>;
    markAllAsRead(): Promise<void>;
}
