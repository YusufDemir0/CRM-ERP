import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Public } from '../../common/decorators/public.decorator';
import { RabbitMQHealthIndicator } from './rabbitmq.health';

/**
 * HealthController — Kubernetes liveness/readiness probes.
 * 
 * GET /api/health → Returns { status: 'ok' } if all dependencies are healthy.
 * This endpoint is PUBLIC (no JWT required) for orchestrator probes.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly rmqIndicator: RabbitMQHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([
      // Database connectivity
      () => this.db.pingCheck('database', { timeout: 3000 }),
      // RabbitMQ connectivity
      () => this.rmqIndicator.isHealthy('rabbitmq'),
    ]);
  }
}
