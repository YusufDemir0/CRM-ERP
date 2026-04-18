"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAuditLog1776163392169 = void 0;
const typeorm_1 = require("typeorm");
class CreateAuditLog1776163392169 {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: "audit_log",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "entityName",
                    type: "varchar",
                    length: "100"
                },
                {
                    name: "entityId",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "action",
                    type: "varchar",
                    length: "20"
                },
                {
                    name: "oldValues",
                    type: "longtext",
                    isNullable: true
                },
                {
                    name: "newValues",
                    type: "longtext",
                    isNullable: true
                },
                {
                    name: "userId",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "createdAt",
                    type: "datetime",
                    default: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);
        await queryRunner.createIndex("audit_log", new typeorm_1.TableIndex({
            name: "IDX_AUDIT_ENTITY",
            columnNames: ["entityName", "entityId"]
        }));
        await queryRunner.createIndex("audit_log", new typeorm_1.TableIndex({
            name: "IDX_AUDIT_USER_DATE",
            columnNames: ["userId", "createdAt"]
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropTable("audit_log");
    }
}
exports.CreateAuditLog1776163392169 = CreateAuditLog1776163392169;
//# sourceMappingURL=1776163392169-CreateAuditLog.js.map