import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemLog } from './entities/log.entity';
import { Subject, Subscription } from 'rxjs';
import { bufferTime, filter } from 'rxjs/operators';
import { getSafeSearchPattern } from '../../common/utils/sql.helper';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LogsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('SystemAudit');
  private readonly logSubject = new Subject<Partial<SystemLog>>();
  private logSubscription: Subscription;
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
    
    if (this.dbLoggingEnabled) {
      // PERF-02: Batch logs with safety limit (1000 logs or 5 seconds)
      this.logSubscription = this.logSubject.pipe(
        bufferTime(5000, undefined, 1000), 
        filter(logs => logs.length > 0)
      ).subscribe(async (logs) => {
        try {
          const entities = this.logRepository.create(logs);
          await this.logRepository.save(entities);
        } catch (err) {
          // Fallback to standard logger if DB fails
          this.logger.error(`Failed to save batched logs to DB: ${err.message}`);
        }
      });
    }
  }

  onModuleDestroy() {
    if (this.logSubscription) {
      this.logSubscription.unsubscribe();
    }
  }

  async findAll(query: { search?: string; module?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC'; skip?: number; limit?: number; page?: number }): Promise<{ data: SystemLog[], meta: { total: number, page: number, limit: number, totalPages: number } }> {
    // Note: If DB logging is disabled, this will return empty or stale data. 
    // This maintains UI compatibility while allowing RDBMS offloading.
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

  /**
   * Primary entry point for logging. 
   * Always writes to Stdout (JSON) for ELK/Loki.
   * Optionally writes to DB for UI visibility.
   */
  logActivity(data: Partial<SystemLog>) {
    // 1. Always Stdout (Enterprise Standard)
    const logPayload = {
      timestamp: new Date().toISOString(),
      ...data,
    };
    this.logger.log(JSON.stringify(logPayload));

    // 2. Conditional DB (UI Compatibility)
    if (this.dbLoggingEnabled) {
      this.logSubject.next(data);
    }
  }

  async addLog(data: Partial<SystemLog>): Promise<SystemLog | null> {
    this.logActivity(data);
    return null; // Interface consistency
  }

  async getNotifications(limit: number = 20): Promise<SystemLog[]> {
    return this.logRepository.find({
      where: { isDeleted: false },
      order: { createdAt: 'DESC' },
      take: limit
    });
  }

  async markAsRead(id: number): Promise<void> {
    await this.logRepository.update(id, { isDeleted: true });
  }

  async markAllAsRead(): Promise<void> {
    await this.logRepository.update({ isDeleted: false }, { isDeleted: true });
  }
}
