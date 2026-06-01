import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Public } from '../../common/decorators/public.decorator';
import { RabbitMQHealthIndicator } from './rabbitmq.health';
import { DataSource } from 'typeorm';

/**
 * HealthController — Kubernetes liveness/readiness probes + DB diagnostics.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly rmqIndicator: RabbitMQHealthIndicator,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 3000 }),
      () => this.rmqIndicator.isHealthy('rabbitmq'),
    ]);
  }

  @Get('diag')
  @Public()
  async getDiagnostics() {
    const results: any = {};
    try {
      // 1. SHOW TABLES
      const tables = await this.dataSource.query('SHOW TABLES');
      results.tables = tables;

      // 2. DESCRIBE tables
      const outboxExists = tables.some((t: any) => Object.values(t).includes('outbox_events'));
      if (outboxExists) {
        results.outbox_events_schema = await this.dataSource.query('DESCRIBE outbox_events');
      } else {
        results.outbox_events_schema = 'NOT FOUND';
      }

      const installmentsExists = tables.some((t: any) => Object.values(t).includes('sales_installments'));
      if (installmentsExists) {
        results.sales_installments_schema = await this.dataSource.query('DESCRIBE sales_installments');
      } else {
        results.sales_installments_schema = 'NOT FOUND';
      }

      results.sales_schema = await this.dataSource.query('DESCRIBE sales');
      results.parties_schema = await this.dataSource.query('DESCRIBE parties');

      // 3. Test a quick transaction to simulate approval locking
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        const sale = await queryRunner.manager.query('SELECT * FROM sales LIMIT 1');
        results.test_sale_fetch = sale;
        if (sale && sale.length > 0) {
          const s = sale[0];
          // Try to lock sale
          await queryRunner.manager.query('SELECT * FROM sales WHERE id = ? FOR UPDATE', [s.id]);
          results.test_sale_lock = 'SUCCESS';
        }
        await queryRunner.commitTransaction();
      } catch (txErr: any) {
        results.test_tx_error = txErr.message || txErr;
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }

    } catch (err: any) {
      results.error = err.message || err;
      if (err.stack) {
        results.stack = err.stack;
      }
    }
    return results;
  }
}
