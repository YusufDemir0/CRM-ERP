import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SystemLog } from './entities/log.entity';
import { ConfigService } from '@nestjs/config';
export declare class LogsService implements OnModuleInit, OnModuleDestroy {
    private readonly logRepository;
    private readonly configService;
    private readonly logger;
    private readonly logSubject;
    private logSubscription;
    private readonly dbLoggingEnabled;
    constructor(logRepository: Repository<SystemLog>, configService: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    findAll(query: {
        search?: string;
        module?: string;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
        skip?: number;
        limit?: number;
        page?: number;
    }): Promise<{
        data: SystemLog[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    logActivity(data: Partial<SystemLog>): void;
    addLog(data: Partial<SystemLog>): Promise<SystemLog | null>;
    getNotifications(limit?: number): Promise<SystemLog[]>;
    markAsRead(id: number): Promise<void>;
    markAllAsRead(): Promise<void>;
}
