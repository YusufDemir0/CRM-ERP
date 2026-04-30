import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { InventoryModule } from '../inventory/inventory.module';
import { LogsModule } from '../logs/logs.module';
import { Bom } from './entities/bom.entity';
import { BomItem } from './entities/bom-item.entity';
import { ProductionOrder } from './entities/production-order.entity';
import { ProductionSequence } from './entities/production-sequence.entity';
import { Item } from '../inventory/items/entities/item.entity';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bom, BomItem, ProductionOrder, ProductionSequence, Item]),
    CommonModule,
    InventoryModule,
    LogsModule,
  ],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {}