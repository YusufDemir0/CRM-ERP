import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ItemCodeGroup } from '../../modules/inventory/items/entities/item-code-group.entity';
import { Department } from '../../modules/departments/entities/department.entity';
import { TransactionContextService } from './transaction-context.service';

/**
 * SequenceGeneratorService — Benzersiz ve sıralı kodlar üretir.
 * 
 * RACE CONDITION FIX:
 * Uses INSERT IGNORE + SELECT FOR UPDATE pattern to eliminate the
 * concurrent-insert race that existed with the old INSERT-after-check approach.
 * Safe for multi-pod (Kubernetes) deployments.
 */
@Injectable()
export class SequenceGeneratorService {
  private readonly logger = new Logger(SequenceGeneratorService.name);
  
  constructor(
    private readonly transactionContext: TransactionContextService,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Veritabanı kilidi (Row-Level Lock) ile sıradaki numarayı verir.
   * 
   * Pattern: INSERT IGNORE → SELECT FOR UPDATE → UPDATE
   * - INSERT IGNORE ensures the row exists without racing
   * - SELECT FOR UPDATE serializes concurrent access
   * - UPDATE increments atomically
   */
  private async getNextNumber(table: string, idField: string, idValue: number | string): Promise<number> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: Ensure the row exists (INSERT IGNORE = idempotent, no race)
      await queryRunner.query(
        `INSERT IGNORE INTO ${table} (${idField}, current_number) VALUES (?, 0)`,
        [idValue]
      );

      // Step 2: Lock the row and read current value
      const [row] = await queryRunner.query(
        `SELECT current_number as id FROM ${table} WHERE ${idField} = ? FOR UPDATE`,
        [idValue]
      );

      // Step 3: Increment and persist
      const next = Number(row.id) + 1;
      await queryRunner.query(
        `UPDATE ${table} SET current_number = ? WHERE ${idField} = ?`,
        [next, idValue]
      );

      await queryRunner.commitTransaction();
      return next;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error generating sequence for ${table} (${idField}=${idValue}): ${err.message}`);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async generateItemCode(
    manager: EntityManager = this.transactionContext.manager,
    itemCodeGroupId: string,
  ): Promise<string> {
    const codeGroup = await manager.findOne(ItemCodeGroup, { where: { id: itemCodeGroupId } });
    if (!codeGroup) throw new NotFoundException(`Item code group bulunamadı: ${itemCodeGroupId}`);

    const currentNumber = await this.getNextNumber('item_code_sequences', 'item_code_group_id', itemCodeGroupId);
    const code = `${codeGroup.prefix}-${String(currentNumber).padStart(3, '0')}`;
    
    return code;
  }

  async generateSaleCode(
    manager: EntityManager = this.transactionContext.manager,
    departmentId: string,
  ): Promise<string> {
    const department = await manager.findOne(Department, { where: { id: departmentId } });
    if (!department) throw new NotFoundException(`Departman bulunamadı: ${departmentId}`);

    // FAZ 2.2: Yeni Format M + DEP + 00001
    const deptPrefix = (department.abbreviation || 'GEN').toUpperCase();
    const finalPrefix = `M${deptPrefix}`;

    const currentNumber = await this.getNextNumber('sale_sequences', 'department_id', departmentId);
    const code = `${finalPrefix}${String(currentNumber).padStart(5, '0')}`;
    
    return code;
  }

  async generateProductionCode(
    manager: EntityManager = this.transactionContext.manager,
    prefix: string = 'URT',
  ): Promise<string> {
    const currentNumber = await this.getNextNumber('production_sequences', 'prefix', prefix);
    const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
    
    return code;
  }

  async generateTransactionCode(
    manager: EntityManager = this.transactionContext.manager,
    prefix: string,
  ): Promise<string> {
    const currentNumber = await this.getNextNumber('transaction_sequences', 'prefix', prefix);
    const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
    
    return code;
  }
}
