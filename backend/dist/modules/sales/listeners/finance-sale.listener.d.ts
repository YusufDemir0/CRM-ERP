import { Repository, DataSource } from 'typeorm';
import { AccountingLedger } from '../../parties/entities/ledger.entity';
import { Party } from '../../parties/entities/party.entity';
import { Transaction } from '../../finance/transactions/entities/transaction.entity';
import { Sale } from '../entities/sale.entity';
import { Decimal } from 'decimal.js';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { TransactionContextService } from '../../../common/services/transaction-context.service';
export declare class FinanceSaleListener {
    private readonly dataSource;
    private readonly sequenceGenerator;
    private ledgerRepo;
    private partyRepo;
    private txRepo;
    private readonly transactionContext;
    private readonly logger;
    constructor(dataSource: DataSource, sequenceGenerator: SequenceGeneratorService, ledgerRepo: Repository<AccountingLedger>, partyRepo: Repository<Party>, txRepo: Repository<Transaction>, transactionContext: TransactionContextService);
    handleFinanceLogic(payload: {
        sale: Sale;
        tlGrandTotal: Decimal;
        deposit: Decimal;
        commercialAccountId?: number;
        userId?: number;
    }): Promise<void>;
}
