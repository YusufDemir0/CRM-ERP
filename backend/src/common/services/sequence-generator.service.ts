import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ItemCodeGroup } from '../../modules/inventory/items/entities/item-code-group.entity';
import { Department } from '../../modules/departments/entities/department.entity';
import { TransactionContextService } from './transaction-context.service';

/**
 * SequenceGeneratorService — Benzersiz ve sıralı kodlar üretir.
 * 
 * TRANSACTION ISOLATION FIX:
 * Uses the caller's EntityManager (from @Transactional context) instead of
 * creating an independent QueryRunner. This ensures sequence increments
 * roll back with the parent transaction, eliminating number gaps.
 *
 * Pattern: INSERT IGNORE → SELECT FOR UPDATE → UPDATE
 * - INSERT IGNORE ensures the row exists without racing
 * - SELECT FOR UPDATE serializes concurrent access
 * - UPDATE increments atomically
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
   * Atomic MySQL pattern: INSERT ... ON DUPLICATE KEY UPDATE current_number = LAST_INSERT_ID(current_number + 1)
   * 
   * @param manager Çağıran fonksiyonun EntityManager'ı (transaction context)
   * @param table Sıra numarası tablosu
   * @param idField ID alanı adı
   * @param idValue ID değeri
   */
  private async getNextNumber(manager: EntityManager, table: string, idField: string, idValue: number | string): Promise<number> {
    try {
      // 1. Tablo ve kolon isimleri whitelist doğrulaması (SQL Injection Koruması)
      const allowedTables = ['item_code_sequences', 'sale_sequences', 'production_sequences', 'transaction_sequences'];
      const allowedFields = ['item_code_group_id', 'department_id', 'prefix'];

      if (!allowedTables.includes(table) || !allowedFields.includes(idField)) {
        throw new Error(`Güvensiz tablo/alan adı tespit edildi: ${table}.${idField}`);
      }

      // 2. MySQL Atomic Upsert using LAST_INSERT_ID
      await manager.query(
        `INSERT INTO \`${table}\` (\`${idField}\`, \`current_number\`)
         VALUES (?, 1)
         ON DUPLICATE KEY UPDATE \`current_number\` = LAST_INSERT_ID(\`current_number\` + 1)`,
        [idValue],
      );

      const res = await manager.query(`SELECT LAST_INSERT_ID() as nextVal`);
      const nextVal = res && res[0] && res[0].nextVal !== undefined ? Number(res[0].nextVal) : 1;
      return isNaN(nextVal) || nextVal <= 0 ? 1 : nextVal;
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(`Error generating sequence for ${table} (${idField}=${idValue}): ${error.message}`);
      throw err;
    }
  }

  async generateItemCode(
    manager: EntityManager = this.transactionContext.manager,
    itemCodeGroupId: string,
  ): Promise<string> {
    const codeGroup = await manager.findOne(ItemCodeGroup, { where: { id: itemCodeGroupId } });
    if (!codeGroup) throw new NotFoundException(`Item code group bulunamadı: ${itemCodeGroupId}`);

    const currentNumber = await this.getNextNumber(manager, 'item_code_sequences', 'item_code_group_id', itemCodeGroupId);
    const code = `${codeGroup.prefix}-${String(currentNumber).padStart(3, '0')}`;
    
    return code;
  }

  async generateSaleCode(
    manager: EntityManager = this.transactionContext.manager,
    departmentId: string,
  ): Promise<string> {
    const department = await manager.findOne(Department, { where: { id: departmentId } });
    if (!department) throw new NotFoundException(`Departman bulunamadı: ${departmentId}`);

    // Format: DEP + 00001
    const deptPrefix = (department.abbreviation || 'GEN').toUpperCase();
    const finalPrefix = deptPrefix;

    const currentNumber = await this.getNextNumber(manager, 'sale_sequences', 'department_id', departmentId);
    const code = `${finalPrefix}${String(currentNumber).padStart(5, '0')}`;
    
    return code;
  }

  async generateProductionCode(
    manager: EntityManager = this.transactionContext.manager,
    prefix: string = 'URT',
  ): Promise<string> {
    const currentNumber = await this.getNextNumber(manager, 'production_sequences', 'prefix', prefix);
    const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
    
    return code;
  }

  async generateTransactionCode(
    manager: EntityManager = this.transactionContext.manager,
    prefix: string,
  ): Promise<string> {
    const currentNumber = await this.getNextNumber(manager, 'transaction_sequences', 'prefix', prefix);
    const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
    
    return code;
  }
}
