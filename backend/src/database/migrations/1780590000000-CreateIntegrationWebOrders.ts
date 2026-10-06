import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIntegrationWebOrders1780590000000 implements MigrationInterface {
  name = 'CreateIntegrationWebOrders1780590000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`integration_web_orders\` (
        \`idempotency_key\` varchar(64) NOT NULL,
        \`sale_id\` bigint NOT NULL,
        \`party_id\` bigint NOT NULL,
        \`department_id\` bigint NOT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (\`idempotency_key\`),
        UNIQUE KEY \`UQ_integration_web_orders_sale\` (\`sale_id\`),
        CONSTRAINT \`FK_integration_web_orders_sale\` FOREIGN KEY (\`sale_id\`) REFERENCES \`sales\` (\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`FK_integration_web_orders_party\` FOREIGN KEY (\`party_id\`) REFERENCES \`parties\` (\`id\`) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `integration_web_orders`');
  }
}
