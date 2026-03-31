import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrenciesController } from './currencies/currencies.controller';
import { CurrenciesService } from './currencies/currencies.service';
import { AccountsController } from './accounts/accounts.controller';
import { AccountsService } from './accounts/accounts.service';
import { TransactionsController } from './transactions/transactions.controller';
import { TransactionsService } from './transactions/transactions.service';
import { Currency } from './currencies/entities/currency.entity';
import { CommercialAccount } from './accounts/entities/commercial-account.entity';
import { Transaction } from './transactions/entities/transaction.entity';
import { TransactionSequence } from './transactions/entities/transaction-sequence.entity';
import { Party } from '../parties/entities/party.entity';
import { SequenceGeneratorService } from '../../common/services/sequence-generator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Currency, CommercialAccount, Transaction, TransactionSequence, Party]),
  ],
  controllers: [CurrenciesController, AccountsController, TransactionsController],
  providers: [CurrenciesService, AccountsService, TransactionsService, SequenceGeneratorService],
  exports: [CurrenciesService, AccountsService, TransactionsService],
})
export class FinanceModule {}
