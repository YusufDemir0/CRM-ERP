import { Injectable, OnModuleInit } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InternalEventBus } from '../../../common/services/event-bus.service';
import { StocksService } from '../../inventory/stocks/stocks.service';
import { Sale } from '../entities/sale.entity';

@Injectable()
export class InventorySaleListener implements OnModuleInit {
  constructor(
    private readonly eventBus: InternalEventBus,
    private readonly stocksService: StocksService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribeSync('sale.approved', async (payload: { sale: Sale, departmentId: number, userId?: number, manager?: EntityManager }) => {
      await this.handleSaleApproved(payload);
    });
  }

  private async handleSaleApproved(payload: { sale: Sale, departmentId: number, userId?: number, manager?: EntityManager }) {
    // DB-02: Reservoir Stock for approved sales
    await this.stocksService.reserveStockBulk(
      payload.sale.items,
      payload.departmentId,
      payload.manager, // Use shared transaction if provided
      payload.userId
    );
  }
}
