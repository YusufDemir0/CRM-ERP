import { OnModuleInit } from '@nestjs/common';
import { InternalEventBus } from '../../../common/services/event-bus.service';
import { StocksService } from '../../inventory/stocks/stocks.service';
export declare class InventorySaleListener implements OnModuleInit {
    private readonly eventBus;
    private readonly stocksService;
    constructor(eventBus: InternalEventBus, stocksService: StocksService);
    onModuleInit(): void;
    private handleSaleApproved;
}
