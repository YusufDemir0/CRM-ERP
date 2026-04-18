"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncMissingColumns1776163392171 = void 0;
class SyncMissingColumns1776163392171 {
    constructor() {
        this.name = 'SyncMissingColumns1776163392171';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`stocks\` ADD \`reserved_quantity\` decimal(15,4) NOT NULL DEFAULT '0.0000' AFTER \`quantity\``);
        await queryRunner.query(`ALTER TABLE \`sales\` ADD \`department_id\` bigint NULL AFTER \`sale_type_id\``);
        await queryRunner.query(`ALTER TABLE \`sales\` ADD INDEX \`IDX_sales_department\` (\`department_id\`)`);
        await queryRunner.query(`ALTER TABLE \`production_orders\` ADD \`labor_cost\` decimal(15,4) NOT NULL DEFAULT '0.0000' AFTER \`total_cost\``);
        await queryRunner.query(`ALTER TABLE \`production_orders\` ADD \`overhead_cost\` decimal(15,4) NOT NULL DEFAULT '0.0000' AFTER \`labor_cost\``);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`production_orders\` DROP COLUMN \`overhead_cost\``);
        await queryRunner.query(`ALTER TABLE \`production_orders\` DROP COLUMN \`labor_cost\``);
        await queryRunner.query(`DROP INDEX \`IDX_sales_department\` ON \`sales\``);
        await queryRunner.query(`ALTER TABLE \`sales\` DROP COLUMN \`department_id\``);
        await queryRunner.query(`ALTER TABLE \`stocks\` DROP COLUMN \`reserved_quantity\``);
    }
}
exports.SyncMissingColumns1776163392171 = SyncMissingColumns1776163392171;
//# sourceMappingURL=1776163392171-SyncMissingColumns.js.map