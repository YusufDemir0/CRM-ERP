import { OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Sale } from '../entities/sale.entity';
import { Decimal } from 'decimal.js';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { RabbitMQService } from '../../../common/services/rabbitmq.service';
export declare class FinanceSaleListener implements OnModuleInit {
    private readonly dataSource;
    private readonly sequenceGenerator;
    private readonly rabbitMQService;
    private readonly logger;
    constructor(dataSource: DataSource, sequenceGenerator: SequenceGeneratorService, rabbitMQService: RabbitMQService);
    onModuleInit(): Promise<void>;
    private setupConsumer;
    handleFinanceLogic(payload: {
        sale: Sale;
        tlGrandTotal: Decimal;
        deposit: Decimal;
        commercialAccountId: string;
        userId: string;
    }): Promise<void>;
    private setupCancelConsumer;
    handleFinanceCancelLogic(payload: {
        sale: Sale;
        tlGrandTotal: Decimal;
        tlDeposit: Decimal;
        userId: string;
    }): Promise<void>;
}
