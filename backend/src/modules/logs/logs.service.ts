import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemLog } from './entities/log.entity';
import { Subject, Subscription } from 'rxjs';
import { bufferTime, filter } from 'rxjs/operators';

@Injectable()
export class LogsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LogsService.name);
  private readonly logSubject = new Subject<Partial<SystemLog>>();
  private logSubscription: Subscription;

  constructor(
    @InjectRepository(SystemLog)
    private readonly logRepository: Repository<SystemLog>,
  ) {}

  onModuleInit() {
    this.logger.log('LogsService initialized (Batch Logger enabled).');
    
    // PERF-02: Batch logs with safety limit (1000 logs or 5 seconds)
    this.logSubscription = this.logSubject.pipe(
      bufferTime(5000, undefined, 1000), // Buffer logs for 5 seconds OR 1000 items
      filter(logs => logs.length > 0) // Only proceed if there are logs
    ).subscribe(async (logs) => {
      try {
        const entities = this.logRepository.create(logs);
        await this.logRepository.save(entities);
        // Optional: this.logger.debug(`Batched ${logs.length} logs to DB.`);
      } catch (err) {
        this.logger.error(`Failed to save batched logs: ${err.message}`);
      }
    });
  }

  onModuleDestroy() {
    if (this.logSubscription) {
      this.logSubscription.unsubscribe();
    }
  }

  async findAll(query: { search?: string; module?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC'; skip?: number; limit?: number; page?: number }): Promise<{ data: SystemLog[], meta: { total: number, page: number, limit: number, totalPages: number } }> {
    const qb = this.logRepository.createQueryBuilder('log');

    if (query.search) {
      qb.where('(log.username LIKE :s OR log.fullName LIKE :s OR log.action LIKE :s OR log.module LIKE :s OR log.details LIKE :s)', { s: `%${query.search}%` });
    }

    if (query.module) {
      qb.andWhere('log.module = :module', { module: query.module });
    }

    qb.orderBy(`log.${query.sortBy || 'createdAt'}`, query.sortOrder || 'DESC');
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
   * Batch log persistence (Non-blocking for the caller)
   */
  logActivity(data: Partial<SystemLog>) {
    this.logSubject.next(data);
  }

  /**
   * Blocking log persistence (Immediate save)
   */
  async addLog(data: Partial<SystemLog>): Promise<SystemLog> {
    const log = this.logRepository.create(data);
    return this.logRepository.save(log);
  }
}
