import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemLog } from './entities/log.entity';
import { getSafeSearchPattern } from '../../common/utils/sql.helper';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LogsService implements OnModuleInit {
  private readonly logger = new Logger('SystemAudit');
  private readonly dbLoggingEnabled: boolean;

  constructor(
    @InjectRepository(SystemLog)
    private readonly logRepository: Repository<SystemLog>,
    private readonly configService: ConfigService,
  ) {
    this.dbLoggingEnabled = this.configService.get<boolean>('DB_LOGGING_ENABLED', false);
  }

  onModuleInit() {
    this.logger.log(`LogsService initialized. DB Logging: ${this.dbLoggingEnabled}`);
  }

  async findAll(query: { search?: string; module?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC'; skip?: number; limit?: number; page?: number }): Promise<{ data: SystemLog[], meta: { total: number, page: number, limit: number, totalPages: number } }> {
    const qb = this.logRepository.createQueryBuilder('log');

    if (query.search) {
      const s = getSafeSearchPattern(query.search);
      qb.where('(log.username LIKE :s OR log.fullName LIKE :s OR log.action LIKE :s OR log.module LIKE :s OR log.details LIKE :s)', { s });
    }

    if (query.module) {
      qb.andWhere('log.module = :module', { module: query.module });
    }

    const allowedSortCols = ['createdAt', 'tag', 'username', 'action', 'module'];
    const sortCol = allowedSortCols.includes(query.sortBy || '') ? query.sortBy! : 'createdAt';
    qb.orderBy(`log.${sortCol}`, (query.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC');

    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 20,
        totalPages: Math.ceil(total / (query.limit || 20))
      }
    };
  }

  logActivity(data: Partial<SystemLog>) {
    // 1. Always Stdout (Enterprise Standard)
    const logPayload = {
      timestamp: new Date().toISOString(),
      ...data,
    };
    this.logger.log(JSON.stringify(logPayload));
  }

  async addLog(data: Partial<SystemLog>): Promise<SystemLog | null> {
    // Print to stdout immediately
    this.logActivity(data);
    
    // Write to DB instantly to prevent crash data loss
    if (this.dbLoggingEnabled) {
      try {
        const entity = this.logRepository.create(data);
        return await this.logRepository.save(entity);
      } catch (err) {
        this.logger.error(`Failed to save log to DB: ${err.message}`);
      }
    }
    return null;
  }

  async getNotifications(limit: number = 20): Promise<SystemLog[]> {
    return this.logRepository.find({
      select: ['id', 'action', 'module', 'tag', 'details', 'createdAt'],
      where: { isDeleted: false },
      order: { createdAt: 'DESC' },
      take: limit
    });
  }

  async markAsRead(id: string): Promise<void> {
    await this.logRepository.update(id, { isDeleted: true });
  }

  async markAllAsRead(): Promise<void> {
    await this.logRepository.update({ isDeleted: false }, { isDeleted: true });
  }
}
