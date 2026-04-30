import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SaleType } from './entities/sale-type.entity';
import { SaleSequence } from './entities/sale-sequence.entity';
import { Party } from '../parties/entities/party.entity';
import { SequenceGeneratorService } from '../../common/services/sequence-generator.service';
import { InventoryModule } from '../inventory/inventory.module';
import { LogsModule } from '../logs/logs.module';
import { InventorySaleListener } from './listeners/inventory-sale.listener';
import { FinanceSaleListener } from './listeners/finance-sale.listener';
import { AccountingLedger } from '../parties/entities/ledger.entity';
import { Transaction } from '../finance/transactions/entities/transaction.entity';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale, SaleItem, SaleType, SaleSequence, Party, AccountingLedger, Transaction
    ]),
    CommonModule,
    InventoryModule,
    LogsModule,
  ],
  controllers: [SalesController],
  providers: [
    SalesService, 
    InventorySaleListener, 
    FinanceSaleListener
  ],
  exports: [SalesService],
})
export class SalesModule {}
