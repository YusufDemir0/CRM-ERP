import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { RabbitMQHealthIndicator } from './rabbitmq.health';
import { DataSource } from 'typeorm';
export declare class HealthController {
    private readonly health;
    private readonly db;
    private readonly rmqIndicator;
    private readonly dataSource;
    constructor(health: HealthCheckService, db: TypeOrmHealthIndicator, rmqIndicator: RabbitMQHealthIndicator, dataSource: DataSource);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult & import("@nestjs/terminus").HealthIndicatorResult<"database">, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult & import("@nestjs/terminus").HealthIndicatorResult<"database">> | undefined, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult & import("@nestjs/terminus").HealthIndicatorResult<"database">> | undefined>>;
    getDiagnostics(): Promise<any>;
}
