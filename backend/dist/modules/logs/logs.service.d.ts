import { Repository } from 'typeorm';
import { SystemLog } from './entities/log.entity';
export declare class LogsService {
    private readonly logRepository;
    private readonly logger;
    constructor(logRepository: Repository<SystemLog>);
    findAll(limit?: number): Promise<SystemLog[]>;
    addLog(data: Partial<SystemLog>): Promise<SystemLog>;
}
