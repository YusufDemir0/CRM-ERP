"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepairSchemaGaps1776163392173 = void 0;
class RepairSchemaGaps1776163392173 {
    constructor() {
        this.name = 'RepairSchemaGaps1776163392173';
    }
    async up(queryRunner) {
        const hasMovingAverageCost = await queryRunner.hasColumn('items', 'moving_average_cost');
        if (!hasMovingAverageCost) {
            await queryRunner.query(`ALTER TABLE \`items\` ADD \`moving_average_cost\` decimal(15,4) NOT NULL DEFAULT '0.0000' AFTER \`purchase_price\``);
        }
        const hasCriticalLimit = await queryRunner.hasColumn('items', 'critical_limit');
        if (!hasCriticalLimit) {
            await queryRunner.query(`ALTER TABLE \`items\` ADD \`critical_limit\` decimal(15,4) NOT NULL DEFAULT '0.0000' AFTER \`moving_average_cost\``);
        }
        const hasWastageQuantity = await queryRunner.hasColumn('production_orders', 'wastage_quantity');
        if (!hasWastageQuantity) {
            await queryRunner.query(`ALTER TABLE \`production_orders\` ADD \`wastage_quantity\` decimal(15,4) NOT NULL DEFAULT '0.0000' AFTER \`produced_quantity\``);
        }
    }
    async down(queryRunner) {
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
exports.RepairSchemaGaps1776163392173 = RepairSchemaGaps1776163392173;
//# sourceMappingURL=1776163392173-RepairSchemaGaps.js.map