import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedItemTypes1777485136671 implements MigrationInterface {
  name = 'SeedItemTypes1777485136671';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if they exist to avoid duplicate errors, otherwise insert
    await queryRunner.query(`
      INSERT INTO \`item_types\` (\`name\`, \`abbreviation\`, \`is_excluded_from_bom\`, \`state\`)
      SELECT * FROM (SELECT 'TİCARİ MAMÜL', 'TM', 1, 1) AS tmp
      WHERE NOT EXISTS (
          SELECT name FROM \`item_types\` WHERE name = 'TİCARİ MAMÜL'
      ) LIMIT 1;
    `);

    await queryRunner.query(`
      INSERT INTO \`item_types\` (\`name\`, \`abbreviation\`, \`is_excluded_from_bom\`, \`state\`)
      SELECT * FROM (SELECT 'YAN MADDE', 'YM', 0, 1) AS tmp
      WHERE NOT EXISTS (
          SELECT name FROM \`item_types\` WHERE name = 'YAN MADDE'
      ) LIMIT 1;
    `);

    await queryRunner.query(`
      INSERT INTO \`item_types\` (\`name\`, \`abbreviation\`, \`is_excluded_from_bom\`, \`state\`)
      SELECT * FROM (SELECT 'HAMMADDE', 'HM', 0, 1) AS tmp
      WHERE NOT EXISTS (
          SELECT name FROM \`item_types\` WHERE name = 'HAMMADDE'
      ) LIMIT 1;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM \`item_types\` WHERE name IN ('TİCARİ MAMÜL', 'YAN MADDE', 'HAMMADDE')`);
  }
}
