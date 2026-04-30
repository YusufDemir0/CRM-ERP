import { MigrationInterface, QueryRunner } from "typeorm";

export class RepairSchemaGaps1776163392173 implements MigrationInterface {
    name = 'RepairSchemaGaps1776163392173'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Items Table: moving_average_cost
        const hasMovingAverageCost = await queryRunner.hasColumn('items', 'moving_average_cost');
        if (!hasMovingAverageCost) {
            await queryRunner.query(`ALTER TABLE \`items\` ADD \`moving_average_cost\` decimal(15,4) NOT NULL DEFAULT '0.0000' AFTER \`purchase_price\``);
        }

        // Items Table: critical_limit
        const hasCriticalLimit = await queryRunner.hasColumn('items', 'critical_limit');
        if (!hasCriticalLimit) {
            await queryRunner.query(`ALTER TABLE \`items\` ADD \`critical_limit\` decimal(15,4) NOT NULL DEFAULT '0.0000' AFTER \`moving_average_cost\``);
        }

        // Production Orders: wastage_quantity
        const hasWastageQuantity = await queryRunner.hasColumn('production_orders', 'wastage_quantity');
        if (!hasWastageQuantity) {
            await queryRunner.query(`ALTER TABLE \`production_orders\` ADD \`wastage_quantity\` decimal(15,4) NOT NULL DEFAULT '0.0000' AFTER \`produced_quantity\``);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasColumn('production_orders', 'wastage_quantity')) {
            await queryRunner.query(`ALTER TABLE \`production_orders\` DROP COLUMN \`wastage_quantity\``);
        }
        if (await queryRunner.hasColumn('items', 'critical_limit')) {
            await queryRunner.query(`ALTER TABLE \`items\` DROP COLUMN \`critical_limit\``);
        }
        if (await queryRunner.hasColumn('items', 'moving_average_cost')) {
            await queryRunner.query(`ALTER TABLE \`items\` DROP COLUMN \`moving_average_cost\``);
        }
    }
}
