import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthCheck,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';

import { ConfigService } from '@nestjs/config';

import { Public } from '../../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
    private configService: ConfigService,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([
      // 1. Database Layer
      () => this.db.pingCheck('database', { timeout: 3000 }),
      
      // 2. Cache Layer (Redis)
      /*
      () =>
        this.microservice.pingCheck('redis', {
          transport: 5, // Transport.REDIS
          options: {
            host: this.configService.get('REDIS_HOST'),
            port: this.configService.get('REDIS_PORT'),
          },
        }),

      // 3. Messaging Layer (RabbitMQ)
      () =>
        this.microservice.pingCheck('rabbitmq', {
          transport: 4, // Transport.RMQ
          options: {
            urls: [this.configService.get('RABBITMQ_URL')],
          },
        }),
      */

      // 4. Infrastructure - Memory
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      
      // 5. Infrastructure - Disk
      () =>
        this.disk.checkStorage('disk_storage', {
          thresholdPercent: 0.9,
          path: '/',
        }),
    ]);
  }
}
