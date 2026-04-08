import { LogsService } from './logs.service';
export declare class LogsController {
    private readonly logsService;
    constructor(logsService: LogsService);
    findAll(limit?: number): Promise<import("./entities/log.entity").SystemLog[]>;
}
