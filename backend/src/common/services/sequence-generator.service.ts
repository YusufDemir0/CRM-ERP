import { Injectable, Logger } from '@nestjs/common';
import { QueryRunner } from 'typeorm';

/**
 * SequenceGeneratorService — Pessimistic Locking ile Ardışık Kod Üretimi
 *
 * Bu servis, race condition'ları önlemek için SELECT ... FOR UPDATE kullanır.
 * Her zaman dışarıdan geçirilen bir QueryRunner (transaction) ile çalışır.
 *
 * Desteklenen tablolar:
 * - item_sequences     → item_type_id bazlı (TEL-001, HMD-005)
 * - sale_sequences      → sale_type_id bazlı (SAT-001, PES-002)
 * - production_sequences → prefix bazlı (URT-001)
 * - transaction_sequences → prefix bazlı (MKB-001, TDY-002)
 *
 * Kullanım:
 *   const code = await sequenceGenerator.generateItemCode(queryRunner, itemTypeId);
 *   const code = await sequenceGenerator.generateSaleCode(queryRunner, saleTypeId);
 *   const code = await sequenceGenerator.generateProductionCode(queryRunner, prefix);
 *   const code = await sequenceGenerator.generateTransactionCode(queryRunner, prefix);
 */
@Injectable()
export class SequenceGeneratorService {
  private readonly logger = new Logger(SequenceGeneratorService.name);

  /**
   * Item kodu üretir: ABBREVIATION-XXX (Örn: TEL-001)
   * item_sequences tablosunda item_type_id bazlı pessimistic lock
   */
  async generateItemCode(
    queryRunner: QueryRunner,
    itemTypeId: number,
  ): Promise<string> {
    // 1. item_type'ın abbreviation'ını al
    const itemType = await queryRunner.query(
      `SELECT abbreviation FROM item_types WHERE id = ? AND deleted_at IS NULL`,
      [itemTypeId],
    );

    if (!itemType || itemType.length === 0) {
      throw new Error(`Item type bulunamadı: ${itemTypeId}`);
    }

    const prefix = itemType[0].abbreviation;

    // 2. Sequence satırını pessimistic lock ile kilitle
    const sequences = await queryRunner.query(
      `SELECT id, current_number FROM item_sequences WHERE item_type_id = ? FOR UPDATE`,
      [itemTypeId],
    );

    let currentNumber: number;

    if (sequences.length === 0) {
      // İlk kez oluşturuluyor
      await queryRunner.query(
        `INSERT INTO item_sequences (item_type_id, current_number) VALUES (?, 1)`,
        [itemTypeId],
      );
      currentNumber = 1;
    } else {
      currentNumber = sequences[0].current_number;
    }

    // 3. Kodu oluştur
    const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;

    // 4. current_number'ı artır
    await queryRunner.query(
      `UPDATE item_sequences SET current_number = current_number + 1 WHERE item_type_id = ?`,
      [itemTypeId],
    );

    this.logger.debug(`Generated item code: ${code}`);
    return code;
  }

  /**
   * Satış kodu üretir: ABBREVIATION-XXX (Örn: SAT-001)
   * sale_sequences tablosunda sale_type_id bazlı pessimistic lock
   */
  async generateSaleCode(
    queryRunner: QueryRunner,
    saleTypeId: number,
  ): Promise<string> {
    // 1. sale_type'ın abbreviation'ını al
    const saleType = await queryRunner.query(
      `SELECT abbreviation FROM sale_types WHERE id = ? AND deleted_at IS NULL`,
      [saleTypeId],
    );

    if (!saleType || saleType.length === 0) {
      throw new Error(`Sale type bulunamadı: ${saleTypeId}`);
    }

    const prefix = saleType[0].abbreviation;

    // 2. Sequence satırını pessimistic lock ile kilitle
    const sequences = await queryRunner.query(
      `SELECT id, current_number FROM sale_sequences WHERE sale_type_id = ? FOR UPDATE`,
      [saleTypeId],
    );

    let currentNumber: number;

    if (sequences.length === 0) {
      await queryRunner.query(
        `INSERT INTO sale_sequences (sale_type_id, current_number) VALUES (?, 1)`,
        [saleTypeId],
      );
      currentNumber = 1;
    } else {
      currentNumber = sequences[0].current_number;
    }

    const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;

    await queryRunner.query(
      `UPDATE sale_sequences SET current_number = current_number + 1 WHERE sale_type_id = ?`,
      [saleTypeId],
    );

    this.logger.debug(`Generated sale code: ${code}`);
    return code;
  }

  /**
   * Üretim emri kodu üretir: PREFIX-XXX (Örn: URT-001)
   * production_sequences tablosunda prefix bazlı pessimistic lock
   */
  async generateProductionCode(
    queryRunner: QueryRunner,
    prefix: string = 'URT',
  ): Promise<string> {
    // Sequence satırını pessimistic lock ile kilitle
    const sequences = await queryRunner.query(
      `SELECT id, current_number FROM production_sequences WHERE prefix = ? FOR UPDATE`,
      [prefix],
    );

    let currentNumber: number;

    if (sequences.length === 0) {
      await queryRunner.query(
        `INSERT INTO production_sequences (prefix, current_number) VALUES (?, 1)`,
        [prefix],
      );
      currentNumber = 1;
    } else {
      currentNumber = sequences[0].current_number;
    }

    const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;

    await queryRunner.query(
      `UPDATE production_sequences SET current_number = current_number + 1 WHERE prefix = ?`,
      [prefix],
    );

    this.logger.debug(`Generated production code: ${code}`);
    return code;
  }

  /**
   * İşlem (transaction) kodu üretir: PREFIX-XXX (Örn: MKB-001, TDY-002)
   * transaction_sequences tablosunda prefix bazlı pessimistic lock
   */
  async generateTransactionCode(
    queryRunner: QueryRunner,
    prefix: string,
  ): Promise<string> {
    const sequences = await queryRunner.query(
      `SELECT id, current_number FROM transaction_sequences WHERE prefix = ? FOR UPDATE`,
      [prefix],
    );

    let currentNumber: number;

    if (sequences.length === 0) {
      await queryRunner.query(
        `INSERT INTO transaction_sequences (prefix, current_number) VALUES (?, 1)`,
        [prefix],
      );
      currentNumber = 1;
    } else {
      currentNumber = sequences[0].current_number;
    }

    const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;

    await queryRunner.query(
      `UPDATE transaction_sequences SET current_number = current_number + 1 WHERE prefix = ?`,
      [prefix],
    );

    this.logger.debug(`Generated transaction code: ${code}`);
    return code;
  }
}
