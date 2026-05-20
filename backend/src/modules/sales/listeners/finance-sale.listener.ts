import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AccountingLedger } from '../../parties/entities/ledger.entity';
import { Party } from '../../parties/entities/party.entity';
import { Transaction } from '../../finance/transactions/entities/transaction.entity';
import { Sale } from '../entities/sale.entity';
import { Decimal } from 'decimal.js';
import { FinanceHelper as FH } from '../../../common/utils/finance.helper';
import { DateUtils } from '../../../common/utils/date.utils';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { RabbitMQService } from '../../../common/services/rabbitmq.service';

@Injectable()
export class FinanceSaleListener implements OnModuleInit {
  private readonly logger = new Logger(FinanceSaleListener.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly sequenceGenerator: SequenceGeneratorService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async onModuleInit() {
    this.setupConsumer();
    this.setupCancelConsumer();
  }

  private setupConsumer() {
    const trySubscribe = async () => {
      if (this.rabbitMQService.isConnected()) {
        await this.rabbitMQService.subscribe(
          'ermay.finance.sale_approved',
          'sale.approved',
          async (msg) => {
            try {
              const payload = JSON.parse(msg.content.toString());
              // Rehydrate Decimals from JSON
              payload.tlGrandTotal = new Decimal(payload.tlGrandTotal || 0);
              payload.deposit = new Decimal(payload.deposit || 0);
              await this.handleFinanceLogic(payload);
            } catch (err) {
              this.logger.error(`Error processing finance logic: ${err.message}`);
              throw err;
            }
          }
        );
      } else {
        setTimeout(trySubscribe, 2000);
      }
    };
    trySubscribe();
  }

  async handleFinanceLogic(payload: { 
    sale: Sale, 
    tlGrandTotal: Decimal, 
    deposit: Decimal, 
    commercialAccountId: string,
    userId: string,
  }) {
    const { sale, tlGrandTotal, deposit, commercialAccountId, userId } = payload;
    
    await this.dataSource.transaction(async (qr) => {
      // 🔥 IDEMPOTENCY CHECK: Check if we already processed this sale in the ledger
      const exists = await qr.findOne(AccountingLedger, {
        where: { source: 'SALE', transactionId: sale.id }
      });

      if (exists) {
        this.logger.warn(`Idempotency: Finance logic for sale.id=${sale.id} already processed. Skipping.`);
        return;
      }

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
            const txCode = await this.sequenceGenerator.generateTransactionCode(qr, 'MKB');
            
            await qr.save(qr.create(Transaction, {
              code: txCode, 
              partyId: party.id, 
              commercialAccountId,
              amount: sale.deposit, 
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
              credit: deposit, 
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
        throw err;
      }
    });
  }

  private setupCancelConsumer() {
    const trySubscribe = async () => {
      if (this.rabbitMQService.isConnected()) {
        await this.rabbitMQService.subscribe(
          'ermay.finance.sale_cancelled',
          'sale.cancelled',
          async (msg) => {
            try {
              const payload = JSON.parse(msg.content.toString());
              payload.tlGrandTotal = new Decimal(payload.tlGrandTotal || 0);
              payload.tlDeposit = new Decimal(payload.tlDeposit || 0);
              await this.handleFinanceCancelLogic(payload);
            } catch (err) {
              this.logger.error(`Error processing finance cancel logic: ${err.message}`);
              throw err;
            }
          }
        );
      } else {
        setTimeout(trySubscribe, 2000);
      }
    };
    trySubscribe();
  }

  async handleFinanceCancelLogic(payload: { 
    sale: Sale, 
    tlGrandTotal: Decimal, 
    tlDeposit: Decimal, 
    userId: string,
  }) {
    const { sale, tlGrandTotal, tlDeposit, userId } = payload;
    
    await this.dataSource.transaction(async (qr) => {
      const exists = await qr.findOne(AccountingLedger, {
        where: { source: 'CANCEL_SALE', transactionId: sale.id }
      });

      if (exists) {
        this.logger.warn(`Idempotency: Finance cancel logic for sale.id=${sale.id} already processed. Skipping.`);
        return;
      }

      try {
        const party = await qr.findOne(Party, { 
          where: { id: sale.partyId },
          lock: { mode: 'pessimistic_write' }
        });

        if (party) {
          const targetBalance = FH.add(FH.sub(party.balance, tlGrandTotal), tlDeposit);
          
          await qr.save(qr.create(AccountingLedger, {
            date: DateUtils.getToday(),
            partyId: party.id,
            debit: new Decimal(0),
            credit: tlGrandTotal,
            transactionId: sale.id,
            source: 'CANCEL_SALE',
            description: `${sale.code} Satış İptali - Borç Revert`
          }));

          if (tlDeposit.gt(0)) {
            const depositTx = await qr.findOne(Transaction, {
              where: { referenceType: 'sale', referenceId: sale.id, type: 'in' }
            });

            await qr.save(qr.create(AccountingLedger, {
              date: DateUtils.getToday(),
              partyId: party.id,
              accountId: depositTx?.commercialAccountId,
              debit: tlDeposit,
              credit: new Decimal(0),
              transactionId: sale.id,
              source: 'CANCEL_DEPOSIT',
              description: `${sale.code} Kapora İptali - Alacak Revert`
            }));
            
            // Cancel the deposit transaction too
            if (depositTx) {
              depositTx.status = 'cancelled';
              depositTx.updatedBy = userId;
              await qr.save(Transaction, depositTx);
            }
          }

          party.balance = targetBalance;
          party.updatedBy = userId || null;
          await qr.save(Party, party);
        }

        this.logger.log(`Finance cancel logic completed for sale ${sale.code}`);
      } catch (err) {
        this.logger.error(`Failed to process finance cancel for sale ${payload.sale.code}: ${err.message}`);
        throw err;
      }
    });
  }
}
