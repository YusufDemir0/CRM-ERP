"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPaidAmountToSales1716410000000 = void 0;
class AddPaidAmountToSales1716410000000 {
    constructor() {
        this.name = 'AddPaidAmountToSales1716410000000';
    }
    async up(queryRunner) {
        const columns = await queryRunner.query(`SHOW COLUMNS FROM \`sales\` LIKE 'paid_amount'`);
        if (columns.length === 0) {
            await queryRunner.query(`ALTER TABLE \`sales\` ADD \`paid_amount\` decimal(15,2) NOT NULL DEFAULT 0.00 AFTER \`grand_total\``);
        }
    }
    async down(queryRunner) {
        const columns = await queryRunner.query(`SHOW COLUMNS FROM \`sales\` LIKE 'paid_amount'`);
        if (columns.length > 0) {
            await queryRunner.query(`ALTER TABLE \`sales\` DROP COLUMN \`paid_amount\``);
        }
    }
}
exports.AddPaidAmountToSales1716410000000 = AddPaidAmountToSales1716410000000;
//# sourceMappingURL=1716410000000-AddPaidAmountToSales.js.map