import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SaleType } from './entities/sale-type.entity';
import { SaleSequence } from './entities/sale-sequence.entity';
import { Stock } from '../inventory/stocks/entities/stock.entity';
import { StockMovement } from '../inventory/stocks/entities/stock-movement.entity';
import { Party } from '../parties/entities/party.entity';
import { SequenceGeneratorService } from '../../common/services/sequence-generator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale, SaleItem, SaleType, SaleSequence,
      Stock, StockMovement, Party,
    ]),
  ],
  controllers: [SalesController],
  providers: [SalesService, SequenceGeneratorService],
  exports: [SalesService],
})
export class SalesModule {}
