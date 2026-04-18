"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncSaleItemsColumns1776163392172 = void 0;
class SyncSaleItemsColumns1776163392172 {
    constructor() {
        this.name = 'SyncSaleItemsColumns1776163392172';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`sale_items\` ADD \`shipped_quantity\` decimal(15,4) NOT NULL DEFAULT '0.0000' AFTER \`quantity\``);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`sale_items\` DROP COLUMN \`shipped_quantity\``);
    }
}
exports.SyncSaleItemsColumns1776163392172 = SyncSaleItemsColumns1776163392172;
//# sourceMappingURL=1776163392172-SyncSaleItemsColumns.js.map