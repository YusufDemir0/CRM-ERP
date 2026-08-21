import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransferToReferenceType1780460000000 implements MigrationInterface {
    name = 'AddTransferToReferenceType1780460000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`transactions\` 
            MODIFY COLUMN \`reference_type\` ENUM('sale', 'purchase', 'manual_adjustment', 'manual', 'sale_deposit', 'transfer') DEFAULT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`transactions\` 
            MODIFY COLUMN \`reference_type\` ENUM('sale', 'purchase', 'manual_adjustment', 'manual', 'sale_deposit') DEFAULT NULL
        `);
    }
}
