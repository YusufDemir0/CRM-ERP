import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { RabbitMQService } from '../../common/services/rabbitmq.service';
export declare class RabbitMQHealthIndicator extends HealthIndicator {
    private readonly rabbitmq;
    constructor(rabbitmq: RabbitMQService);
    isHealthy(key: string): Promise<HealthIndicatorResult>;
}
