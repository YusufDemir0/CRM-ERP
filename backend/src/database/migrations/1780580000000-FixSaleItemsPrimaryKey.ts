import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSaleItemsPrimaryKey1780580000000 implements MigrationInterface {
  name = 'FixSaleItemsPrimaryKey1780580000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if `id` column already exists in `sale_items`
    const hasId = await queryRunner.hasColumn('sale_items', 'id');
    if (!hasId) {
      // Check current primary key
      const table = await queryRunner.getTable('sale_items');
      const primaryColumns = table?.primaryColumns || [];

      // If composite primary key on sale_id and item_id exists, drop it
      if (primaryColumns.length > 0) {
        try {
          await queryRunner.query('ALTER TABLE `sale_items` DROP PRIMARY KEY');
        } catch (e) {
          // Ignore if already dropped
        }
      }

      // Add auto-increment primary key id column
      await queryRunner.query(
        'ALTER TABLE `sale_items` ADD COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT FIRST, ADD PRIMARY KEY (`id`)'
      );

      // Ensure indexes exist for fast lookup
      await queryRunner.query(
        'CREATE INDEX IF NOT EXISTS `IDX_sale_items_sale_id` ON `sale_items` (`sale_id`)'
      );
      await queryRunner.query(
        'CREATE INDEX IF NOT EXISTS `IDX_sale_items_item_id` ON `sale_items` (`item_id`)'
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasId = await queryRunner.hasColumn('sale_items', 'id');
    if (hasId) {
      await queryRunner.query('ALTER TABLE `sale_items` DROP PRIMARY KEY');
      await queryRunner.query('ALTER TABLE `sale_items` DROP COLUMN `id`');
      await queryRunner.query('ALTER TABLE `sale_items` ADD PRIMARY KEY (`sale_id`, `item_id`)');
    }
  }
}
