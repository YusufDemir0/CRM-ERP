import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../../../common/services/rabbitmq.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionContextService } from '../../../common/services/transaction-context.service';
import { Transactional } from '@nestjs-cls/transactional';
import { ConsumeMessage } from 'amqplib';
import { Decimal } from 'decimal.js';
import { Party } from '../../parties/entities/party.entity';
import { AccountingLedger } from '../../parties/entities/ledger.entity';
import { DateUtils } from '../../../common/utils/date.utils';

@Injectable()
export class FinanceListener implements OnModuleInit {
  private readonly logger = new Logger(FinanceListener.name);

  constructor(
    private readonly rabbitmq: RabbitMQService,
    private readonly transactionsService: TransactionsService,
    private readonly transactionContext: TransactionContextService,
  ) {}

  async onModuleInit() {
    this.logger.log('FinanceListener initializing and subscribing to RabbitMQ...');
    
    // Subscribe to sale approval events
    await this.rabbitmq.subscribe(
      'finance.sale_approved.queue',
      'sale.approved',
      this.handleSaleApproved.bind(this),
    );
  }

  @Transactional()
  private async handleSaleApproved(msg: ConsumeMessage) {
    const payload = JSON.parse(msg.content.toString());
    const { sale, tlGrandTotal, deposit, commercialAccountId, userId } = payload;

    if (!sale) return;

    this.logger.log(`Processing finance for approved sale: ${sale.code}`);

    const manager = this.transactionContext.manager;
    const amount = new Decimal(tlGrandTotal);
    
    try {
      // 1. Update Party Balance (Customer)
      // For a sale, the customer's balance increases (they owe us money)
      await manager.createQueryBuilder()
        .update(Party)
        .set({ balance: () => `balance + ${amount.toString()}` })
        .where('id = :id', { id: sale.partyId })
        .execute();

      // 2. Create Ledger Entry for the Sale
      await manager.save(manager.create(AccountingLedger, {
        date: DateUtils.getToday(),
        partyId: sale.partyId,
        debit: amount,
        credit: new Decimal(0),
        source: 'SALE',
        description: `Satış Onayı: ${sale.code}`,
        createdBy: userId
      }));

      // 3. If there was a deposit, record it as a transaction (Payment In)
      if (deposit && new Decimal(deposit).gt(0)) {
        const depositAmount = new Decimal(deposit);
        
        // This is essentially a payment from the customer
        // Note: transactionsService.create will handle balance update (Credit) and ledger entry
        await this.transactionsService.create({
          partyId: sale.partyId,
          commercialAccountId: commercialAccountId,
          amount: Number(depositAmount),
          currencyId: sale.currencyId,
          type: 'in',
          referenceType: 'sale_deposit',
          referenceId: sale.id,
          date: DateUtils.getToday(),
          description: `Satış Ön Ödemesi: ${sale.code}`
        }, userId);
      }

      this.logger.log(`Finance updated successfully for sale: ${sale.code}`);
    } catch (error) {
      this.logger.error(`Failed to update finance for sale ${sale.code}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
