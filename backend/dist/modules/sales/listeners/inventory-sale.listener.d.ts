import { StocksService } from '../../inventory/stocks/stocks.service';
import { TransactionContextService } from '../../../common/services/transaction-context.service';
import { Sale } from '../entities/sale.entity';
export declare class InventorySaleListener {
    private readonly stocksService;
    private readonly transactionContext;
    private readonly logger;
    constructor(stocksService: StocksService, transactionContext: TransactionContextService);
    handleSaleApproved(payload: {
        sale: Sale;
        departmentId: number;
        userId?: number;
    }): Promise<void>;
}
