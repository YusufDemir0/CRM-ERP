import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncSaleItemsColumns1776163392172 implements MigrationInterface {
    name = 'SyncSaleItemsColumns1776163392172'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`sale_items\` ADD \`shipped_quantity\` decimal(15,4) NOT NULL DEFAULT '0.0000' AFTER \`quantity\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`sale_items\` DROP COLUMN \`shipped_quantity\``);
    }
}
