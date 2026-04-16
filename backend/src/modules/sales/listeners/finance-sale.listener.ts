import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InternalEventBus } from '../../../common/services/event-bus.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AccountingLedger } from '../../parties/entities/ledger.entity';
import { Party } from '../../parties/entities/party.entity';
import { Transaction } from '../../finance/transactions/entities/transaction.entity';
import { Sale } from '../entities/sale.entity';
import { Decimal } from 'decimal.js';
import { FinanceHelper as FH } from '../../../common/utils/finance.helper';
import { DateUtils } from '../../../common/utils/date.utils';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';

@Injectable()
export class FinanceSaleListener implements OnModuleInit {
  private readonly logger = new Logger(FinanceSaleListener.name);

  constructor(
    private readonly eventBus: InternalEventBus,
    private readonly dataSource: DataSource,
    private readonly sequenceGenerator: SequenceGeneratorService,
    @InjectRepository(AccountingLedger) private ledgerRepo: Repository<AccountingLedger>,
    @InjectRepository(Party) private partyRepo: Repository<Party>,
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
  ) {}

  onModuleInit() {
    this.eventBus.on('sale.approved').subscribe(async (payload: { 
      sale: Sale, 
      tlGrandTotal: Decimal, 
      deposit: Decimal, 
      commercialAccountId?: number,
      userId?: number 
    }) => {
      await this.handleFinanceLogic(payload);
    });
  }

  private async handleFinanceLogic(payload: { 
    sale: Sale, 
    tlGrandTotal: Decimal, 
    deposit: Decimal, 
    commercialAccountId?: number,
    userId?: number 
  }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { sale, tlGrandTotal, deposit, commercialAccountId, userId } = payload;
      
      // 1. Debit Party
      await queryRunner.manager.save(queryRunner.manager.create(AccountingLedger, {
        date: DateUtils.getToday(),
        partyId: sale.partyId,
        debit: tlGrandTotal,
        credit: new Decimal(0),
        transactionId: sale.id,
        source: 'SALE',
        description: `${sale.code} numaralı Satış Faturası Borçlandırması`
      }));

      const party = await queryRunner.manager.findOne(Party, { 
        where: { id: sale.partyId },
        lock: { mode: 'pessimistic_write' }
      });

      if (party) {
        party.balance = FH.add(party.balance, tlGrandTotal);
        
        // 2. Handle Deposit if exists
        if (deposit.gt(0) && commercialAccountId) {
          const txCode = await this.sequenceGenerator.generateTransactionCode(queryRunner, 'MKB');
          
          await queryRunner.manager.save(queryRunner.manager.create(Transaction, {
            code: txCode, 
            partyId: party.id, 
            commercialAccountId,
            amount: sale.deposit, // Original currency amount
            currencyId: sale.currencyId, 
            exchangeRate: sale.exchangeRate,
            type: 'in', 
            referenceType: 'sale', 
            referenceId: sale.id, 
            date: DateUtils.getToday(),
            description: `${sale.code} Nolu Sipariş Peşinat / Kaporası`, 
            status: 'completed', 
            createdBy: userId
          }));

          await queryRunner.manager.save(queryRunner.manager.create(AccountingLedger, {
            date: DateUtils.getToday(),
            partyId: party.id,
            accountId: commercialAccountId,
            debit: new Decimal(0),
            credit: deposit, // TL amount
            transactionId: sale.id,
            source: 'DEPOSIT',
            description: `${sale.code} Sipariş Peşinat Tahsilatı`
          }));

          party.balance = FH.sub(party.balance, deposit);
        }

        party.updatedBy = userId || null;
        await queryRunner.manager.save(Party, party);
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Finance logic completed for sale ${sale.code}`);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to process finance for sale ${payload.sale.code}: ${err.message}`);
    } finally {
      await queryRunner.release();
    }
  }
}
