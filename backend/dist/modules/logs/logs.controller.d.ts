import { LogsService } from './logs.service';
import { LogsQueryDto } from './dto/logs-query.dto';
export declare class LogsController {
    private readonly logsService;
    constructor(logsService: LogsService);
    findAll(query: LogsQueryDto): Promise<any>;
}
