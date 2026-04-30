import { MigrationInterface, QueryRunner } from "typeorm";

export class AddItemTypeBomExclusion1776163392176 implements MigrationInterface {
    name = 'AddItemTypeBomExclusion1776163392176'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`item_types\` ADD \`is_excluded_from_bom\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`item_types\` DROP COLUMN \`is_excluded_from_bom\``);
    }
}
