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

    // Atomic UPSERT + Increment
    await manager.query(
      `INSERT INTO item_code_sequences (item_code_group_id, current_number)
       VALUES (?, 1)
       ON DUPLICATE KEY UPDATE current_number = current_number + 1`,
      [itemCodeGroupId],
    );

    const [row] = await manager.query(
      `SELECT current_number FROM item_code_sequences WHERE item_code_group_id = ?`,
      [itemCodeGroupId],
    );

    const currentNumber = (row as any).current_number;
    const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
    this.logger.debug(`Generated item code: ${code}`);
    return code;
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

    // Atomic UPSERT + Increment
    await manager.query(
      `INSERT INTO sale_sequences (sale_type_id, current_number)
       VALUES (?, 1)
       ON DUPLICATE KEY UPDATE current_number = current_number + 1`,
      [saleTypeId],
    );

    const [row] = await manager.query(
      `SELECT current_number FROM sale_sequences WHERE sale_type_id = ?`,
      [saleTypeId],
    );

    const currentNumber = (row as any).current_number;
    const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
    this.logger.debug(`Generated sale code: ${code}`);
    return code;
  }

  async generateProductionCode(
    manager: EntityManager = this.transactionContext.manager,
    prefix: string = 'URT',
  ): Promise<string> {
    // Atomic UPSERT + Increment
    await manager.query(
      `INSERT INTO production_sequences (prefix, current_number)
       VALUES (?, 1)
       ON DUPLICATE KEY UPDATE current_number = current_number + 1`,
      [prefix],
    );

    const [row] = await manager.query(
      `SELECT current_number FROM production_sequences WHERE prefix = ?`,
      [prefix],
    );

    const currentNumber = (row as any).current_number;
    const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
    this.logger.debug(`Generated production code: ${code}`);
    return code;
  }

  async generateTransactionCode(
    manager: EntityManager = this.transactionContext.manager,
    prefix: string,
  ): Promise<string> {
    // Atomic UPSERT + Increment
    await manager.query(
      `INSERT INTO transaction_sequences (prefix, current_number)
       VALUES (?, 1)
       ON DUPLICATE KEY UPDATE current_number = current_number + 1`,
      [prefix],
    );

    const [row] = await manager.query(
      `SELECT current_number FROM transaction_sequences WHERE prefix = ?`,
      [prefix],
    );

    const currentNumber = (row as any).current_number;
    const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
    this.logger.debug(`Generated transaction code: ${code}`);
    return code;
  }

}
