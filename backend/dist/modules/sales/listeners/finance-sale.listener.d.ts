import { OnModuleInit } from '@nestjs/common';
import { InternalEventBus } from '../../../common/services/event-bus.service';
import { Repository, DataSource } from 'typeorm';
import { AccountingLedger } from '../../parties/entities/ledger.entity';
import { Party } from '../../parties/entities/party.entity';
import { Transaction } from '../../finance/transactions/entities/transaction.entity';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
export declare class FinanceSaleListener implements OnModuleInit {
    private readonly eventBus;
    private readonly dataSource;
    private readonly sequenceGenerator;
    private ledgerRepo;
    private partyRepo;
    private txRepo;
    private readonly logger;
    constructor(eventBus: InternalEventBus, dataSource: DataSource, sequenceGenerator: SequenceGeneratorService, ledgerRepo: Repository<AccountingLedger>, partyRepo: Repository<Party>, txRepo: Repository<Transaction>);
    onModuleInit(): void;
    private handleFinanceLogic;
}
