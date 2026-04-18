"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HardenUsersAndFixAudit1776163392170 = void 0;
const typeorm_1 = require("typeorm");
class HardenUsersAndFixAudit1776163392170 {
    async up(queryRunner) {
        await queryRunner.query("DROP TABLE IF EXISTS `audit_log` cascade");
        await queryRunner.query("DROP TABLE IF EXISTS `audit_logs` cascade");
        await queryRunner.query(`
            CREATE TABLE \`audit_logs\` (
                \`id\` BIGINT NOT NULL AUTO_INCREMENT,
                \`entity_name\` VARCHAR(100) NOT NULL,
                \`entity_id\` BIGINT NOT NULL,
                \`action\` VARCHAR(50) NOT NULL,
                \`old_values\` TEXT NULL,
                \`new_values\` TEXT NULL,
                \`user_id\` BIGINT NULL,
                \`ip_address\` VARCHAR(45) NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                INDEX \`IDX_AUDIT_ENTITY\` (\`entity_name\`, \`entity_id\`),
                INDEX \`IDX_AUDIT_USER_DATE\` (\`user_id\`, \`created_at\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        const table = await queryRunner.getTable("users");
        if (table && !table.findColumnByName("failed_login_attempts")) {
            await queryRunner.addColumn("users", new typeorm_1.TableColumn({
                name: "failed_login_attempts",
                type: "int",
                default: 0
            }));
        }
        if (table && !table.findColumnByName("locked_until")) {
            await queryRunner.addColumn("users", new typeorm_1.TableColumn({
                name: "locked_until",
                type: "timestamp",
                isNullable: true
            }));
        }
    }
    async down(queryRunner) {
        await queryRunner.dropColumn("users", "locked_until");
        await queryRunner.dropColumn("users", "failed_login_attempts");
        await queryRunner.dropTable("audit_logs");
    }
}
exports.HardenUsersAndFixAudit1776163392170 = HardenUsersAndFixAudit1776163392170;
//# sourceMappingURL=1776163392170-HardenUsersAndFixAudit.js.map