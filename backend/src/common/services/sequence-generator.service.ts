import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { ItemCodeGroup } from '../../modules/inventory/items/entities/item-code-group.entity';
import { ItemCodeSequence } from '../../modules/inventory/items/entities/item-code-sequence.entity';
import { SaleType } from '../../modules/sales/entities/sale-type.entity';
import { SaleSequence } from '../../modules/sales/entities/sale-sequence.entity';
import { ProductionSequence } from '../../modules/production/entities/production-sequence.entity';
import { TransactionSequence } from '../../modules/finance/transactions/entities/transaction-sequence.entity';

@Injectable()
export class SequenceGeneratorService {
  private readonly logger = new Logger(SequenceGeneratorService.name);

  async generateItemCode(
    queryRunner: QueryRunner,
    itemCodeGroupId: number,
  ): Promise<string> {
    // ARCH-02: Lock the parent record to serialize generation for this group
    const codeGroup = await queryRunner.manager.findOne(ItemCodeGroup, {
      where: { id: itemCodeGroupId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!codeGroup) {
      throw new NotFoundException(`Item code group bulunamadı: ${itemCodeGroupId}`);
    }

    const prefix = codeGroup.prefix;

    let sequence = await queryRunner.manager.findOne(ItemCodeSequence, {
      where: { itemCodeGroupId },
      lock: { mode: 'pessimistic_write' },
    });

    let currentNumber: number;

    if (!sequence) {
      try {
        sequence = queryRunner.manager.create(ItemCodeSequence, {
          itemCodeGroupId,
          currentNumber: 1,
        });
        await queryRunner.manager.save(sequence);
        currentNumber = 1;
      } catch (e) {
        // Race condition: Someone else created the sequence record while we were looking for it
        sequence = await queryRunner.manager.findOne(ItemCodeSequence, {
          where: { itemCodeGroupId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!sequence) throw e;
        currentNumber = sequence.currentNumber;
      }
    } else {
      currentNumber = sequence.currentNumber;
    }

    const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;

    await queryRunner.manager.update(ItemCodeSequence, sequence.id, {
      currentNumber: currentNumber + 1,
    });

    this.logger.debug(`Generated item code: ${code}`);
    return code;
  }

  async generateSaleCode(
    queryRunner: QueryRunner,
    saleTypeId: number,
  ): Promise<string> {
    // ARCH-02: Lock the parent record to serialize generation for this type
    const saleType = await queryRunner.manager.findOne(SaleType, {
      where: { id: saleTypeId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!saleType) {
      throw new NotFoundException(`Sale type bulunamadı: ${saleTypeId}`);
    }

    const prefix = saleType.abbreviation;

    let sequence = await queryRunner.manager.findOne(SaleSequence, {
      where: { saleTypeId },
      lock: { mode: 'pessimistic_write' },
    });

    let currentNumber: number;

    if (!sequence) {
      try {
        sequence = queryRunner.manager.create(SaleSequence, {
          saleTypeId,
          currentNumber: 1,
        });
        await queryRunner.manager.save(sequence);
        currentNumber = 1;
      } catch (e) {
        sequence = await queryRunner.manager.findOne(SaleSequence, {
          where: { saleTypeId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!sequence) throw e;
        currentNumber = sequence.currentNumber;
      }
    } else {
      currentNumber = sequence.currentNumber;
    }

    const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;

    await queryRunner.manager.update(SaleSequence, sequence.id, {
      currentNumber: currentNumber + 1,
    });

    this.logger.debug(`Generated sale code: ${code}`);
    return code;
  }

  async generateProductionCode(
    queryRunner: QueryRunner,
    prefix: string = 'URT',
  ): Promise<string> {
    let sequence = await queryRunner.manager.findOne(ProductionSequence, {
      where: { prefix },
      lock: { mode: 'pessimistic_write' },
    });

    let currentNumber: number;

    if (!sequence) {
      try {
        sequence = queryRunner.manager.create(ProductionSequence, {
          prefix,
          currentNumber: 1,
        });
        await queryRunner.manager.save(sequence);
        currentNumber = 1;
      } catch (e) {
        sequence = await queryRunner.manager.findOne(ProductionSequence, {
          where: { prefix },
          lock: { mode: 'pessimistic_write' },
        });
        if (!sequence) throw e;
        currentNumber = sequence.currentNumber;
      }
    } else {
      currentNumber = sequence.currentNumber;
    }

    const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;

    await queryRunner.manager.update(ProductionSequence, sequence.id, {
      currentNumber: currentNumber + 1,
    });

    this.logger.debug(`Generated production code: ${code}`);
    return code;
  }

  async generateTransactionCode(
    queryRunner: QueryRunner,
    prefix: string,
  ): Promise<string> {
    let sequence = await queryRunner.manager.findOne(TransactionSequence, {
      where: { prefix },
      lock: { mode: 'pessimistic_write' },
    });

    let currentNumber: number;

    if (!sequence) {
      try {
        sequence = queryRunner.manager.create(TransactionSequence, {
          prefix,
          currentNumber: 1,
        });
        await queryRunner.manager.save(sequence);
        currentNumber = 1;
      } catch (e) {
        sequence = await queryRunner.manager.findOne(TransactionSequence, {
          where: { prefix },
          lock: { mode: 'pessimistic_write' },
        });
        if (!sequence) throw e;
        currentNumber = sequence.currentNumber;
      }
    } else {
      currentNumber = sequence.currentNumber;
    }

    const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;

    await queryRunner.manager.update(TransactionSequence, sequence.id, {
      currentNumber: currentNumber + 1,
    });

    this.logger.debug(`Generated transaction code: ${code}`);
    return code;
  }
}
