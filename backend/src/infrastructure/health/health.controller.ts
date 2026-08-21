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
import { DataSource } from 'typeorm';

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
    private dataSource: DataSource,
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
          thresholdPercent: parseFloat(this.configService.get('HEALTH_DISK_THRESHOLD') || '0.99'),
          path: '/',
        }),
    ]);
  }

  @Get('diag')
  @Public()
  async getDiagnostics() {
    const results: Record<string, unknown> = {};
    try {
      results.stock_movements_schema = await this.dataSource.query('DESCRIBE stock_movements');
      results.stocks_schema = await this.dataSource.query('DESCRIBE stocks');
      results.shipments_schema = await this.dataSource.query('DESCRIBE shipments');
      results.sales_schema = await this.dataSource.query('DESCRIBE sales');
      
      results.recent_movements = await this.dataSource.query('SELECT * FROM stock_movements ORDER BY id DESC LIMIT 5');
      results.recent_shipments = await this.dataSource.query('SELECT * FROM shipments ORDER BY id DESC LIMIT 5');
      results.recent_sales = await this.dataSource.query('SELECT * FROM sales ORDER BY id DESC LIMIT 5');
    } catch (err) {
      results.error = err instanceof Error ? err.message : String(err);
      if (err instanceof Error) {
        results.stack = err.stack;
      }
    }
    return results;
  }

  @Get('debug-dispatch')
  @Public()
  async debugDispatch() {
    const results: Record<string, unknown> = {};
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 1. Get shipment 1
      const [shipment] = await queryRunner.query('SELECT * FROM shipments WHERE id = 1');
      results.shipment = shipment;
      if (!shipment) { results.error = 'Shipment 1 not found'; return results; }

      // 2. Get sale items
      const saleItems: { item_id: number; quantity: number }[] = await queryRunner.query('SELECT * FROM sale_items WHERE sale_id = ?', [shipment.sale_id]);
      results.saleItems = saleItems;
      
      // 3. For each sale item, find stock row
      for (const si of saleItems) {
        const stocks = await queryRunner.query('SELECT * FROM stocks WHERE item_id = ? AND department_id = ?', [si.item_id, shipment.outgoing_department_id]);
        results[`stock_item_${si.item_id}`] = stocks;
        
        // Try to insert a stock_movement with type='reserve'
        try {
          const stockId = stocks.length > 0 ? stocks[0].id : null;
          if (stockId) {
            await queryRunner.query(
              `INSERT INTO stock_movements (stock_id, quantity, quantity_before, quantity_after, type, reference_type, reference_id, description, created_by)
               VALUES (?, ?, ?, ?, 'out', 'reserve', ?, 'TEST - will rollback', '1')`,
              [stockId, si.quantity, stocks[0].quantity, stocks[0].quantity, shipment.id]
            );
            results[`movement_insert_item_${si.item_id}`] = 'SUCCESS';
          } else {
            results[`movement_insert_item_${si.item_id}`] = 'NO_STOCK_ROW';
          }
        } catch (insertErr) {
          const errObj = insertErr as Record<string, unknown>;
          results[`movement_insert_item_${si.item_id}_ERROR`] = {
            message: errObj?.message || String(insertErr),
            code: errObj?.code || errObj?.errno,
            sqlMessage: errObj?.sqlMessage,
          };
        }
      }
    } catch (err) {
      const errObj = err as Record<string, unknown>;
      results.error = errObj?.message || String(err);
      results.code = errObj?.code || errObj?.errno;
      results.sqlMessage = errObj?.sqlMessage;
      if (err instanceof Error) {
        results.stack = err.stack;
      }
    } finally {
      // ALWAYS rollback — this is purely diagnostic
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    }
    return results;
  }
}
