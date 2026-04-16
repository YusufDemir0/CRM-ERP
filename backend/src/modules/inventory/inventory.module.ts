import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceModule } from '../finance/finance.module';
import { LogsModule } from '../logs/logs.module';
import { ItemsController } from './items/items.controller';
import { ItemsService } from './items/items.service';
import { StocksController } from './stocks/stocks.controller';
import { StocksService } from './stocks/stocks.service';
import { Item } from './items/entities/item.entity';
import { ItemType } from './items/entities/item-type.entity';
import { ItemSequence } from './items/entities/item-sequence.entity';
import { ItemCodeGroup } from './items/entities/item-code-group.entity';
import { ItemCodeSequence } from './items/entities/item-code-sequence.entity';
import { QuantityType } from './items/entities/quantity-type.entity';
import { Stock } from './stocks/entities/stock.entity';
import { StockMovement } from './stocks/entities/stock-movement.entity';
import { SequenceGeneratorService } from '../../common/services/sequence-generator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item, ItemType, ItemSequence, ItemCodeGroup, ItemCodeSequence, QuantityType, Stock, StockMovement]),
    FinanceModule,
    LogsModule,
  ],
  controllers: [ItemsController, StocksController],
  providers: [ItemsService, StocksService, SequenceGeneratorService],
  exports: [ItemsService, StocksService, SequenceGeneratorService],
})
export class InventoryModule {}
