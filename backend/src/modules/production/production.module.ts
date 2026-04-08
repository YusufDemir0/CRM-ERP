import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { Bom } from './entities/bom.entity';
import { BomItem } from './entities/bom-item.entity';
import { ProductionOrder } from './entities/production-order.entity';
import { ProductionSequence } from './entities/production-sequence.entity';
import { SequenceGeneratorService } from '../../common/services/sequence-generator.service';
import { Item } from '../inventory/items/entities/item.entity';
import { Stock } from '../inventory/stocks/entities/stock.entity';
import { StockMovement } from '../inventory/stocks/entities/stock-movement.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([Bom, BomItem, ProductionOrder, ProductionSequence, Item, Stock, StockMovement]),
  ],
  controllers: [ProductionController],
  providers: [ProductionService, SequenceGeneratorService],
  exports: [ProductionService],
})
export class ProductionModule {}