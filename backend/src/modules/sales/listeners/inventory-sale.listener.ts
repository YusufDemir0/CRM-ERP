import { Injectable, OnModuleInit } from '@nestjs/common';
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
    this.eventBus.on('sale.approved').subscribe(async (payload: { sale: Sale, departmentId: number, userId?: number }) => {
      await this.handleSaleApproved(payload);
    });
  }

  private async handleSaleApproved(payload: { sale: Sale, departmentId: number, userId?: number }) {
    // DB-02: Reservoir Stock for approved sales
    await this.stocksService.reserveStockBulk(
      payload.sale.items,
      payload.departmentId,
      undefined, // Runs in its own transaction or as side effect
      payload.userId
    );
  }
}
