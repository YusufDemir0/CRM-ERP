import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StocksService } from '../../inventory/stocks/stocks.service';
import { Sale } from '../entities/sale.entity';
import { StockMovement } from '../../inventory/stocks/entities/stock-movement.entity';
import { RabbitMQService } from '../../../common/services/rabbitmq.service';

@Injectable()
export class InventorySaleListener implements OnModuleInit {
  private readonly logger = new Logger(InventorySaleListener.name);

  constructor(
    private readonly stocksService: StocksService,
    private readonly dataSource: DataSource,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async onModuleInit() {
    this.setupConsumer();
  }

  private setupConsumer() {
    const trySubscribe = async () => {
      if (this.rabbitMQService.isConnected()) {
        await this.rabbitMQService.subscribe(
          'ermay.inventory.sale_approved',
          'sale.approved',
          async (msg) => {
            try {
              const payload = JSON.parse(msg.content.toString());
              await this.handleSaleApproved(payload);
            } catch (err) {
              this.logger.error(`Error processing inventory logic: ${err.message}`);
              throw err;
            }
          }
        );
      } else {
        setTimeout(trySubscribe, 2000);
      }
    };
    trySubscribe();
  }

  async handleSaleApproved(payload: { sale: Sale, departmentId: string, userId: string }) {
    const { sale, departmentId, userId } = payload;
    
    await this.dataSource.transaction(async (manager) => {
      // 🔥 IDEMPOTENCY CHECK: Has this sale already caused a stock reservation?
      const existingMovement = await manager.findOne(StockMovement, {
        where: { referenceType: 'sale', referenceId: sale.id }
      });

      if (existingMovement) {
        this.logger.warn(`Idempotency: Inventory reservation for sale.id=${sale.id} already processed. Skipping.`);
        return;
      }

      // DB-02: Reserve Stock for approved sales
      await this.stocksService.reserveStockBulk(
        sale.items,
        departmentId,
        manager,
        { type: 'sale', id: sale.id, description: `Satış Onay Rezervasyonu: ${sale.code}` },
        userId
      );
    });
  }
}
