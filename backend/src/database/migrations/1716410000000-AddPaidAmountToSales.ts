import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaidAmountToSales1716410000000 implements MigrationInterface {
    name = 'AddPaidAmountToSales1716410000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const columns = await queryRunner.query(
            `SHOW COLUMNS FROM \`sales\` LIKE 'paid_amount'`
        );
        if (columns.length === 0) {
            await queryRunner.query(
                `ALTER TABLE \`sales\` ADD \`paid_amount\` decimal(15,2) NOT NULL DEFAULT 0.00 AFTER \`grand_total\``
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const columns = await queryRunner.query(
            `SHOW COLUMNS FROM \`sales\` LIKE 'paid_amount'`
        );
        if (columns.length > 0) {
            await queryRunner.query(
                `ALTER TABLE \`sales\` DROP COLUMN \`paid_amount\``
            );
        }
    }
}
