"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSalesMasterApprovePermission1716300000000 = void 0;
class AddSalesMasterApprovePermission1716300000000 {
    constructor() {
        this.name = 'AddSalesMasterApprovePermission1716300000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('SALES_MASTER_APPROVE','Yetkili Satış Onaylama','sales','manage')`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DELETE FROM \`permissions\` WHERE \`key\` = 'SALES_MASTER_APPROVE'`);
    }
}
exports.AddSalesMasterApprovePermission1716300000000 = AddSalesMasterApprovePermission1716300000000;
//# sourceMappingURL=1716300000000-AddSalesMasterApprovePermission.js.map