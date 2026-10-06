import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ErmayWeb'de olup ERP'de karşılığı olmayan ürünler için 4 deneme (yer tutucu) ürün.
 * Web siparişi bu ürünlerle ERP'ye düşer; gerçek ürün adı satır açıklamasında, fiyat web fiyatındandır.
 * Kâr/zarar bu satırlarda doğru değildir (alış fiyatı 0); satış toplamı teklif fiyatıyla sabitlenir.
 * Kodlar `DNM-` ile başlar ve web kataloğuna gönderilmez.
 */
const PLACEHOLDERS: Array<[code: string, name: string]> = [
  ['DNM-MOBILYA', 'DENEME MOBİLYA'],
  ['DNM-TAKIM', 'DENEME TAKIM'],
  ['DNM-KOLTUK', 'DENEME KOLTUK'],
  ['DNM-MASA', 'DENEME MASA'],
];

export class SeedWebPlaceholderItems1780600000000 implements MigrationInterface {
  name = 'SeedWebPlaceholderItems1780600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [itemType] = await queryRunner.query("SELECT id FROM item_types WHERE abbreviation = 'TCM' LIMIT 1");
    const [quantityType] = await queryRunner.query("SELECT id FROM quantity_types WHERE abbreviation = 'AD' ORDER BY id LIMIT 1");
    if (!itemType || !quantityType) {
      throw new Error('Ticari Mamül (TCM) ürün tipi veya Adet (AD) birimi bulunamadı.');
    }

    for (const [code, name] of PLACEHOLDERS) {
      await queryRunner.query(
        `INSERT INTO items (code, name, item_type_id, quantity_type_id, sale_price, purchase_price, kdv, currency_id, description, created_by, state)
         SELECT ?, ?, ?, ?, 0, 0, 10, 1, ?, 1, 1 FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM items WHERE code = ?)`,
        [
          code,
          name,
          itemType.id,
          quantityType.id,
          "ErmayWeb'de olup ERP'de karşılığı olmayan ürünler için deneme ürün. Gerçek ürün adı satış satırının açıklamasındadır.",
          code,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Satışlarda kullanılmış olabilir: silmek yerine pasife al
    await queryRunner.query("UPDATE items SET state = 0 WHERE code IN ('DNM-MOBILYA', 'DNM-TAKIM', 'DNM-KOLTUK', 'DNM-MASA')");
  }
}
