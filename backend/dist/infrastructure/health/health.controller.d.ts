import { HealthCheckService, TypeOrmHealthIndicator, MemoryHealthIndicator, DiskHealthIndicator, MicroserviceHealthIndicator } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
export declare class HealthController {
    private health;
    private db;
    private memory;
    private disk;
    private microservice;
    private configService;
    private dataSource;
    constructor(health: HealthCheckService, db: TypeOrmHealthIndicator, memory: MemoryHealthIndicator, disk: DiskHealthIndicator, microservice: MicroserviceHealthIndicator, configService: ConfigService, dataSource: DataSource);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"disk_storage"> & import("@nestjs/terminus").HealthIndicatorResult<"memory_heap"> & import("@nestjs/terminus").HealthIndicatorResult<"database">, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"disk_storage"> & import("@nestjs/terminus").HealthIndicatorResult<"memory_heap"> & import("@nestjs/terminus").HealthIndicatorResult<"database">> | undefined, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"disk_storage"> & import("@nestjs/terminus").HealthIndicatorResult<"memory_heap"> & import("@nestjs/terminus").HealthIndicatorResult<"database">> | undefined>>;
    getDiagnostics(): Promise<Record<string, unknown>>;
    debugDispatch(): Promise<Record<string, unknown>>;
}
