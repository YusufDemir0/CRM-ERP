import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateAuditLog1776163392169 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
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

        await queryRunner.createIndex("audit_log", new TableIndex({
            name: "IDX_AUDIT_ENTITY",
            columnNames: ["entityName", "entityId"]
        }));

        await queryRunner.createIndex("audit_log", new TableIndex({
            name: "IDX_AUDIT_USER_DATE",
            columnNames: ["userId", "createdAt"]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("audit_log");
    }

}
