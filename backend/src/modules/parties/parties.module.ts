import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartiesController } from './parties.controller';
import { PartiesService } from './parties.service';
import { Party } from './entities/party.entity';

import { FinanceModule } from '../finance/finance.module';

import { AccountingLedger } from './entities/ledger.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Party, AccountingLedger]),
    FinanceModule
  ],
  controllers: [PartiesController],
  providers: [PartiesService],
  exports: [PartiesService],
})
export class PartiesModule { }
