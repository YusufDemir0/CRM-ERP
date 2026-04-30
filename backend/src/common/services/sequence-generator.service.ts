import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ItemCodeGroup } from '../../modules/inventory/items/entities/item-code-group.entity';
import { Department } from '../../modules/departments/entities/department.entity';
import { TransactionContextService } from './transaction-context.service';

/**
 * SequenceGeneratorService — Benzersiz ve sıralı kodlar üretir.
 * ROAST COMPLIANCE: HiLo (High-Low) pattern implementasyonu. 
 * Her ID üretimi için veritabanına UPDATE atmak yerine (deadlock riski),
 * bellekten 50'lik bloklar halinde numara tahsis edilir. Sadece blok bittiğinde DB'ye gidilir.
 * Autonomous transaction kullanılarak business logic rollback'lerinden etkilenmesi engellenir.
 */
@Injectable()
export class SequenceGeneratorService {
  private readonly logger = new Logger(SequenceGeneratorService.name);
  
  // HiLo Block Configurations
  private readonly BLOCK_SIZE = 50;
  private blocks = new Map<string, { current: number; max: number }>();
  private locks = new Map<string, Promise<void>>();

  constructor(
    private readonly transactionContext: TransactionContextService,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Bellekten sıradaki numarayı verir. Blok tükenmişse DB'den yeni blok tahsis eder.
   */
  private async getNextNumber(manager: EntityManager, table: string, idField: string, idValue: number | string): Promise<number> {
    const cacheKey = `${table}_${idField}_${idValue}`;

    // 1. Sıralı işlem için Lock bekle (Race condition önleme)
    while (this.locks.has(cacheKey)) {
      await this.locks.get(cacheKey);
    }

    // 2. Bellekte hazır blok varsa hemen dön
    let block = this.blocks.get(cacheKey);
    if (block && block.current <= block.max) {
      return block.current++;
    }

    // 3. Yeni blok tahsis süreci (Lock oluştur)
    let release!: () => void;
    const lockPromise = new Promise<void>(resolve => release = resolve);
    this.locks.set(cacheKey, lockPromise);

    try {
      // Lock beklerken başka bir thread bloğu doldurmuş olabilir, tekrar kontrol et
      block = this.blocks.get(cacheKey);
      if (block && block.current <= block.max) {
        return block.current++;
      }

      // 4. Autonomous Transaction ile DB'den blok al
      // Ana işleme (manager) bağlı DEĞİLDİR, bu sayede fatura iptal edilse bile sayaç geri sarmaz
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await queryRunner.query(
          `INSERT INTO ${table} (${idField}, current_number) 
           VALUES (?, ?) 
           ON DUPLICATE KEY UPDATE current_number = current_number + ?`,
          [idValue, this.BLOCK_SIZE, this.BLOCK_SIZE]
        );

        const [row] = await queryRunner.query(
          `SELECT current_number as id FROM ${table} WHERE ${idField} = ?`,
          [idValue]
        );

        await queryRunner.commitTransaction();

        const max = Number(row.id);
        const current = max - this.BLOCK_SIZE + 1;
        
        this.blocks.set(cacheKey, { current: current + 1, max });
        
        this.logger.debug(`[HiLo] Tahsis edildi - Tablo: ${table}, Key: ${idValue}, Blok: ${current}-${max}`);
        return current;

      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    } finally {
      this.locks.delete(cacheKey);
      release();
    }
  }

  async generateItemCode(
    manager: EntityManager = this.transactionContext.manager,
    itemCodeGroupId: number,
  ): Promise<string> {
    const codeGroup = await manager.findOne(ItemCodeGroup, { where: { id: itemCodeGroupId } });
    if (!codeGroup) throw new NotFoundException(`Item code group bulunamadı: ${itemCodeGroupId}`);

    const currentNumber = await this.getNextNumber(manager, 'item_code_sequences', 'item_code_group_id', itemCodeGroupId);
    const code = `${codeGroup.prefix}-${String(currentNumber).padStart(3, '0')}`;
    
    return code;
  }

  async generateSaleCode(
    manager: EntityManager = this.transactionContext.manager,
    departmentId: number,
  ): Promise<string> {
    const department = await manager.findOne(Department, { where: { id: departmentId } });
    if (!department) throw new NotFoundException(`Departman bulunamadı: ${departmentId}`);

    const deptPrefix = (department.abbreviation || 'GEN').toUpperCase();
    const finalPrefix = `S-${deptPrefix}`;

    const currentNumber = await this.getNextNumber(manager, 'sale_sequences', 'department_id', departmentId);
    const code = `${finalPrefix}-${String(currentNumber).padStart(3, '0')}`;
    
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
