"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddDepartmentIdToSaleSequences1776163392175 = void 0;
class AddDepartmentIdToSaleSequences1776163392175 {
    constructor() {
        this.name = 'AddDepartmentIdToSaleSequences1776163392175';
    }
    async up(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS \`sale_sequences\``);
        await queryRunner.query(`
            CREATE TABLE \`sale_sequences\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`department_id\` bigint NOT NULL,
                \`current_number\` int NOT NULL DEFAULT '1',
                \`created_by\` bigint NULL,
                \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_by\` bigint NULL,
                \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`deleted_at\` timestamp NULL,
                \`state\` tinyint NOT NULL DEFAULT '1',
                PRIMARY KEY (\`id\`),
                UNIQUE INDEX \`UQ_sale_sequences_dept\` (\`department_id\`)
            ) ENGINE=InnoDB
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS \`sale_sequences\``);
    }
}
exports.AddDepartmentIdToSaleSequences1776163392175 = AddDepartmentIdToSaleSequences1776163392175;
//# sourceMappingURL=1776163392175-AddDepartmentIdToSaleSequences.js.map