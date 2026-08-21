import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusToUserNotes1780500000000 implements MigrationInterface {
    name = 'AddStatusToUserNotes1780500000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`user_notes\` 
            ADD COLUMN \`status\` varchar(50) DEFAULT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`user_notes\` 
            DROP COLUMN \`status\`
        `);
    }
}
