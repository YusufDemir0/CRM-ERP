import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SystemLog } from './entities/log.entity';
import { ConfigService } from '@nestjs/config';
export declare class LogsService implements OnModuleInit {
    private readonly logRepository;
    private readonly configService;
    private readonly logger;
    private readonly dbLoggingEnabled;
    constructor(logRepository: Repository<SystemLog>, configService: ConfigService);
    onModuleInit(): void;
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
    private sanitizeData;
    logActivity(data: Partial<SystemLog>): void;
    addLog(data: Partial<SystemLog>): Promise<SystemLog | null>;
    getNotifications(limit?: number): Promise<SystemLog[]>;
    markAsRead(id: string): Promise<void>;
    markAllAsRead(): Promise<void>;
}
