import { forwardRef, Module } from '@nestjs/common';
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
import { Shipment } from './stocks/entities/shipment.entity';
import { Vehicle } from './stocks/entities/vehicle.entity';
import { SequenceGeneratorService } from '../../common/services/sequence-generator.service';

import { BomItem } from '../production/entities/bom-item.entity';
import { StocksReportsService } from './stocks/stocks-reports.service';
import { StocksTransactionsService } from './stocks/stocks-transactions.service';
import { ItemsReportsService } from './items/items-reports.service';
import { ItemsTransactionsService } from './items/items-transactions.service';
import { ShipmentsController } from './stocks/shipments.controller';
import { ShipmentsService } from './stocks/shipments.service';
import { VehiclesController } from './stocks/vehicles.controller';
import { VehiclesService } from './stocks/vehicles.service';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Item, ItemType, ItemSequence, ItemCodeGroup, 
      ItemCodeSequence, QuantityType, Stock, StockMovement, Shipment, Vehicle,
      BomItem
    ]),
    FinanceModule,
    LogsModule,
    forwardRef(() => SalesModule),
  ],
  controllers: [ItemsController, StocksController, ShipmentsController, VehiclesController],
  providers: [
    ItemsService, ItemsReportsService, ItemsTransactionsService,
    StocksService, StocksReportsService, StocksTransactionsService, 
    ShipmentsService, VehiclesService, SequenceGeneratorService
  ],
  exports: [
    ItemsService, ItemsReportsService, ItemsTransactionsService,
    StocksService, StocksReportsService, StocksTransactionsService, 
    ShipmentsService, VehiclesService, SequenceGeneratorService
  ],
})
export class InventoryModule {}

