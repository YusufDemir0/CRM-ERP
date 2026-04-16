import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SystemLog } from './entities/log.entity';
export declare class LogsService implements OnModuleInit, OnModuleDestroy {
    private readonly logRepository;
    private readonly logger;
    private readonly logSubject;
    private logSubscription;
    constructor(logRepository: Repository<SystemLog>);
    onModuleInit(): void;
    onModuleDestroy(): void;
    findAll(query: any): Promise<any>;
    logActivity(data: Partial<SystemLog>): void;
    addLog(data: Partial<SystemLog>): Promise<SystemLog>;
}
