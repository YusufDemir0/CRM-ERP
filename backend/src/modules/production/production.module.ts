import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { Bom } from './entities/bom.entity';
import { BomItem } from './entities/bom-item.entity';
import { ProductionOrder } from './entities/production-order.entity';
import { ProductionSequence } from './entities/production-sequence.entity';
import { SequenceGeneratorService } from '../../common/services/sequence-generator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bom, BomItem, ProductionOrder, ProductionSequence]),
  ],
  controllers: [ProductionController],
  providers: [ProductionService, SequenceGeneratorService],
  exports: [ProductionService],
})
export class ProductionModule {}
