import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../../../common/services/rabbitmq.service';
import { StocksService } from '../stocks/stocks.service';
import { TransactionContextService } from '../../../common/services/transaction-context.service';
import { Transactional } from '@nestjs-cls/transactional';
import { ConsumeMessage } from 'amqplib';

interface SaleItemPayload {
  itemId: string;
  quantity: number;
}

@Injectable()
export class InventoryListener implements OnModuleInit {
  private readonly logger = new Logger(InventoryListener.name);

  constructor(
    private readonly rabbitmq: RabbitMQService,
    private readonly stocksService: StocksService,
    private readonly transactionContext: TransactionContextService,
  ) {}

  async onModuleInit() {
    this.logger.log('InventoryListener initializing and subscribing to RabbitMQ...');
    
    // Subscribe to sale approval events
    await this.rabbitmq.subscribe(
      'inventory.sale_approved.queue',
      'sale.approved',
      this.handleSaleApproved.bind(this),
    );
  }

  @Transactional()
  private async handleSaleApproved(msg: ConsumeMessage) {
    const payload = JSON.parse(msg.content.toString());
    const { sale, userId, departmentId } = payload;

    if (!sale || !sale.items) {
      this.logger.warn(`Received empty sale data in inventory listener: ${JSON.stringify(payload)}`);
      return;
    }

    if (!departmentId) {
      this.logger.error(`Missing departmentId in inventory listener for sale: ${sale.code}`);
      return;
    }

    this.logger.log(`Processing inventory for approved sale: ${sale.code}`);

    try {
      // Drop stock for all items in the sale
      await this.stocksService.decreaseStockBulk(
        sale.items.map((item: SaleItemPayload) => ({
          itemId: item.itemId,
          quantity: item.quantity,
        })),
        departmentId,
        this.transactionContext.manager,
        {
          type: 'sale',
          id: sale.id,
          description: `Satış Onayı Stok Çıkışı: ${sale.code}`,
        },
        userId,
      );
      
      this.logger.log(`Inventory updated successfully for sale: ${sale.code}`);
    } catch (error) {
      this.logger.error(`Failed to update inventory for sale ${sale.code}: ${error instanceof Error ? error.message : String(error)}`);
      // Re-throw to trigger RabbitMQ NACK/DLQ logic in RabbitMQService
      throw error;
    }
  }
}
