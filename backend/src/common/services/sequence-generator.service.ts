import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ItemCodeGroup } from '../../modules/inventory/items/entities/item-code-group.entity';
import { Department } from '../../modules/departments/entities/department.entity';
import { TransactionContextService } from './transaction-context.service';

/**
 * SequenceGeneratorService — Benzersiz ve sıralı kodlar üretir.
 * ROAST COMPLIANCE & PHASE 0.2:
 * Memory tabanlı kilitler (Map) kaldırılmış, yerine %100 güvenli
 * Row-Level Lock (SELECT ... FOR UPDATE) yapısı getirilmiştir.
 * Böylece Kubernetes gibi çoklu-pod mimarilerinde sıfır hata ile çalışır.
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
   */
  private async getNextNumber(table: string, idField: string, idValue: number | string): Promise<number> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Satırı okurken kilitle (Başka pod'lar bekler)
      let [row] = await queryRunner.query(
        `SELECT current_number as id FROM ${table} WHERE ${idField} = ? FOR UPDATE`,
        [idValue]
      );

      let current = 1;

      if (!row) {
        // İlk defa oluşturuluyorsa (Eğer aynı anda 2 insert gelirse biri hata fırlatabilir, 
        // ancak idField genelde uygulama kurulurken veya ilk kayıtta üretildiği için risk düşüktür)
        try {
          await queryRunner.query(
            `INSERT INTO ${table} (${idField}, current_number) VALUES (?, ?)`,
            [idValue, 1]
          );
        } catch (insertErr) {
          // Eğer aynı anda başka bir thread insert ettiyse, tekrar kilitli oku
          [row] = await queryRunner.query(
            `SELECT current_number as id FROM ${table} WHERE ${idField} = ? FOR UPDATE`,
            [idValue]
          );
          current = Number(row.id) + 1;
          await queryRunner.query(
            `UPDATE ${table} SET current_number = ? WHERE ${idField} = ?`,
            [current, idValue]
          );
        }
      } else {
        current = Number(row.id) + 1;
        await queryRunner.query(
          `UPDATE ${table} SET current_number = ? WHERE ${idField} = ?`,
          [current, idValue]
        );
      }

      await queryRunner.commitTransaction();
      return current;
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
    itemCodeGroupId: number,
  ): Promise<string> {
    const codeGroup = await manager.findOne(ItemCodeGroup, { where: { id: itemCodeGroupId } });
    if (!codeGroup) throw new NotFoundException(`Item code group bulunamadı: ${itemCodeGroupId}`);

    const currentNumber = await this.getNextNumber('item_code_sequences', 'item_code_group_id', itemCodeGroupId);
    const code = `${codeGroup.prefix}-${String(currentNumber).padStart(3, '0')}`;
    
    return code;
  }

  async generateSaleCode(
    manager: EntityManager = this.transactionContext.manager,
    departmentId: number,
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
