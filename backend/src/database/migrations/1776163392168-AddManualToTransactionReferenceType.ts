import { MigrationInterface, QueryRunner } from "typeorm";

export class AddManualToTransactionReferenceType1776163392168 implements MigrationInterface {
    name = 'AddManualToTransactionReferenceType1776163392168'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transactions\` CHANGE \`reference_type\` \`reference_type\` enum ('sale', 'purchase', 'manual_adjustment', 'manual') NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transactions\` CHANGE \`reference_type\` \`reference_type\` enum ('sale', 'purchase', 'manual_adjustment') NULL`);
    }

}
