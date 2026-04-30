import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { RabbitMQService } from '../../common/services/rabbitmq.service';

@Injectable()
export class RabbitMQHealthIndicator extends HealthIndicator {
  constructor(private readonly rabbitmq: RabbitMQService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isConnected = this.rabbitmq.isConnected();
    const result: HealthIndicatorResult = {
      [key]: {
        status: isConnected ? 'up' : 'down',
      },
    };

    if (isConnected) {
      return result;
    }
    
    throw new HealthCheckError('RabbitMQ health check failed', result);
  }
}
