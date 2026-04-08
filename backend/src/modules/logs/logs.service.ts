import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemLog } from './entities/log.entity';

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);

  constructor(
    @InjectRepository(SystemLog)
    private readonly logRepository: Repository<SystemLog>,
  ) {}

  async findAll(limit: number = 100): Promise<SystemLog[]> {
    return this.logRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // Internal method to be called by other modules to write a log
  async addLog(data: Partial<SystemLog>): Promise<SystemLog> {
    const log = this.logRepository.create(data);
    return this.logRepository.save(log);
  }
}
