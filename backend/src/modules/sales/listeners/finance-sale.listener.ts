import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InternalEventBus } from '../../../common/services/event-bus.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
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
    this.eventBus.subscribeSync('sale.approved', async (payload: { 
      sale: Sale, 
      tlGrandTotal: Decimal, 
      deposit: Decimal, 
      commercialAccountId?: number,
      userId?: number,
      manager?: EntityManager
    }) => {
      await this.handleFinanceLogic(payload);
    });
  }

  private async handleFinanceLogic(payload: { 
    sale: Sale, 
    tlGrandTotal: Decimal, 
    deposit: Decimal, 
    commercialAccountId?: number,
    userId?: number,
    manager?: EntityManager
  }) {
    const { sale, tlGrandTotal, deposit, commercialAccountId, userId, manager } = payload;
    const qr = manager || this.dataSource.manager;

    try {
      // 1. Debit Party
      await qr.save(qr.create(AccountingLedger, {
        date: DateUtils.getToday(),
        partyId: sale.partyId,
        debit: tlGrandTotal,
        credit: new Decimal(0),
        transactionId: sale.id,
        source: 'SALE',
        description: `${sale.code} numaralı Satış Faturası Borçlandırması`
      }));

      const party = await qr.findOne(Party, { 
        where: { id: sale.partyId },
        lock: { mode: 'pessimistic_write' }
      });

      if (party) {
        party.balance = FH.add(party.balance, tlGrandTotal);
        
        // 2. Handle Deposit if exists
        if (deposit.gt(0) && commercialAccountId) {
          // Note: sequenceGenerator should ideally also support manager
          const txCode = await this.sequenceGenerator.generateTransactionCode(qr, 'MKB');
          
          await qr.save(qr.create(Transaction, {
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

          await qr.save(qr.create(AccountingLedger, {
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
        await qr.save(Party, party);
      }

      this.logger.log(`Finance logic completed for sale ${sale.code}`);
    } catch (err) {
      this.logger.error(`Failed to process finance for sale ${payload.sale.code}: ${err.message}`);
      throw err; // RE-THROW so emitSync knows about the failure
    }
  }
}
