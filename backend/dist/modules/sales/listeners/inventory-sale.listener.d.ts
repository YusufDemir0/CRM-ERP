import { OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StocksService } from '../../inventory/stocks/stocks.service';
import { Sale } from '../entities/sale.entity';
import { RabbitMQService } from '../../../common/services/rabbitmq.service';
export declare class InventorySaleListener implements OnModuleInit {
    private readonly stocksService;
    private readonly dataSource;
    private readonly rabbitMQService;
    private readonly logger;
    constructor(stocksService: StocksService, dataSource: DataSource, rabbitMQService: RabbitMQService);
    onModuleInit(): Promise<void>;
    private setupConsumer;
    handleSaleApproved(payload: {
        sale: Sale;
        departmentId: number;
        userId?: number;
    }): Promise<void>;
}
