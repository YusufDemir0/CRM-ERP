import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ItemCodeGroup } from '../../modules/inventory/items/entities/item-code-group.entity';
import { ItemCodeSequence } from '../../modules/inventory/items/entities/item-code-sequence.entity';
import { SaleType } from '../../modules/sales/entities/sale-type.entity';
import { SaleSequence } from '../../modules/sales/entities/sale-sequence.entity';
import { ProductionSequence } from '../../modules/production/entities/production-sequence.entity';
import { TransactionSequence } from '../../modules/finance/transactions/entities/transaction-sequence.entity';
import { TransactionContextService } from './transaction-context.service';

@Injectable()
export class SequenceGeneratorService {
  private readonly logger = new Logger(SequenceGeneratorService.name);

  constructor(
    private readonly transactionContext: TransactionContextService,
    private readonly dataSource: DataSource
  ) {}

  async generateItemCode(
    manager: EntityManager = this.transactionContext.manager,
    itemCodeGroupId: number,
  ): Promise<string> {
    const codeGroup = await manager.findOne(ItemCodeGroup, { where: { id: itemCodeGroupId } });
    if (!codeGroup) {
      throw new NotFoundException(`Item code group bulunamadı: ${itemCodeGroupId}`);
    }

    const prefix = codeGroup.prefix;

    return await this.dataSource.transaction(async (autonomousManager) => {
      let sequence = await autonomousManager.findOne(ItemCodeSequence, { where: { itemCodeGroupId } });

      if (!sequence) {
        try {
          const newSeq = autonomousManager.create(ItemCodeSequence, { itemCodeGroupId, currentNumber: 2 });
          await autonomousManager.save(newSeq);
          return `${prefix}-001`;
        } catch (e) {
          // Ignored. Another thread might have inserted it.
        }
      }

      sequence = await autonomousManager
        .createQueryBuilder(ItemCodeSequence, 'seq')
        .setLock('pessimistic_write')
        .where('seq.itemCodeGroupId = :id', { id: itemCodeGroupId })
        .getOne();

      const currentNumber = sequence!.currentNumber;
      await autonomousManager.update(ItemCodeSequence, sequence!.id, { 
        currentNumber: currentNumber + 1 
      });

      const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
      this.logger.debug(`Generated item code: ${code}`);
      return code;
    });
  }

  async generateSaleCode(
    manager: EntityManager = this.transactionContext.manager,
    saleTypeId: number,
  ): Promise<string> {
    const saleType = await manager.findOne(SaleType, { where: { id: saleTypeId } });
    if (!saleType) {
      throw new NotFoundException(`Sale type bulunamadı: ${saleTypeId}`);
    }

    const prefix = saleType.abbreviation;

    return await this.dataSource.transaction(async (autonomousManager) => {
      let sequence = await autonomousManager.findOne(SaleSequence, { where: { saleTypeId } });

      if (!sequence) {
        try {
          const newSeq = autonomousManager.create(SaleSequence, { saleTypeId, currentNumber: 2 });
          await autonomousManager.save(newSeq);
          return `${prefix}-001`;
        } catch (e) {
          // Ignored. Another thread might have inserted it.
        }
      }

      sequence = await autonomousManager
        .createQueryBuilder(SaleSequence, 'seq')
        .setLock('pessimistic_write')
        .where('seq.saleTypeId = :id', { id: saleTypeId })
        .getOne();

      const currentNumber = sequence!.currentNumber;
      await autonomousManager.update(SaleSequence, sequence!.id, { 
        currentNumber: currentNumber + 1 
      });

      const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
      this.logger.debug(`Generated sale code: ${code}`);
      return code;
    });
  }

  async generateProductionCode(
    manager: EntityManager = this.transactionContext.manager,
    prefix: string = 'URT',
  ): Promise<string> {
    return await this.dataSource.transaction(async (autonomousManager) => {
      let sequence = await autonomousManager.findOne(ProductionSequence, { where: { prefix } });

      if (!sequence) {
        try {
          const newSeq = autonomousManager.create(ProductionSequence, { prefix, currentNumber: 2 });
          await autonomousManager.save(newSeq);
          return `${prefix}-001`;
        } catch (e) {
          // Ignored. Another thread might have inserted it.
        }
      }

      sequence = await autonomousManager
        .createQueryBuilder(ProductionSequence, 'seq')
        .setLock('pessimistic_write')
        .where('seq.prefix = :prefix', { prefix })
        .getOne();

      const currentNumber = sequence!.currentNumber;
      await autonomousManager.update(ProductionSequence, sequence!.id, { 
        currentNumber: currentNumber + 1 
      });

      const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
      this.logger.debug(`Generated production code: ${code}`);
      return code;
    });
  }

  async generateTransactionCode(
    manager: EntityManager = this.transactionContext.manager,
    prefix: string,
  ): Promise<string> {
    return await this.dataSource.transaction(async (autonomousManager) => {
      let sequence = await autonomousManager.findOne(TransactionSequence, { where: { prefix } });

      if (!sequence) {
        try {
          const newSeq = autonomousManager.create(TransactionSequence, { prefix, currentNumber: 2 });
          await autonomousManager.save(newSeq);
          return `${prefix}-001`;
        } catch (e) {
          // Ignored. Another thread might have inserted it.
        }
      }

      sequence = await autonomousManager
        .createQueryBuilder(TransactionSequence, 'seq')
        .setLock('pessimistic_write')
        .where('seq.prefix = :prefix', { prefix })
        .getOne();

      const currentNumber = sequence!.currentNumber;
      await autonomousManager.update(TransactionSequence, sequence!.id, { 
        currentNumber: currentNumber + 1 
      });

      const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
      this.logger.debug(`Generated transaction code: ${code}`);
      return code;
    });
  }
}
