"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddManualToTransactionReferenceType1776163392168 = void 0;
class AddManualToTransactionReferenceType1776163392168 {
    constructor() {
        this.name = 'AddManualToTransactionReferenceType1776163392168';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`transactions\` CHANGE \`reference_type\` \`reference_type\` enum ('sale', 'purchase', 'manual_adjustment', 'manual') NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`transactions\` CHANGE \`reference_type\` \`reference_type\` enum ('sale', 'purchase', 'manual_adjustment') NULL`);
    }
}
exports.AddManualToTransactionReferenceType1776163392168 = AddManualToTransactionReferenceType1776163392168;
//# sourceMappingURL=1776163392168-AddManualToTransactionReferenceType.js.map