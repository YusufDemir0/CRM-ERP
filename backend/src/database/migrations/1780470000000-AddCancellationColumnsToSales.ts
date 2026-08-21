import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCancellationColumnsToSales1780470000000 implements MigrationInterface {
    name = 'AddCancellationColumnsToSales1780470000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`sales\` 
            ADD COLUMN \`cancelled_by_id\` bigint(20) DEFAULT NULL,
            ADD COLUMN \`cancelled_at\` timestamp NULL DEFAULT NULL,
            ADD COLUMN \`cancel_reason\` text DEFAULT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`sales\` 
            DROP COLUMN \`cancelled_by_id\`,
            DROP COLUMN \`cancelled_at\`,
            DROP COLUMN \`cancel_reason\`
        `);
    }
}
