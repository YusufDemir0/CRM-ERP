import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class HardenUsersAndFixAudit1776163392170 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Auditログテーブル（名前とカラムの不整合を解消）
        // 古い不完全なテーブルを削除して、正しい型で再作成する
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

        // 2. Usersテーブルにセキュリティ用カラムを追加
        // カラムが既に存在しないか確認して追加（二重追加防止）
        const table = await queryRunner.getTable("users");
        
        if (table && !table.findColumnByName("failed_login_attempts")) {
            await queryRunner.addColumn("users", new TableColumn({
                name: "failed_login_attempts",
                type: "int",
                default: 0
            }));
        }

        if (table && !table.findColumnByName("locked_until")) {
            await queryRunner.addColumn("users", new TableColumn({
                name: "locked_until",
                type: "timestamp",
                isNullable: true
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("users", "locked_until");
        await queryRunner.dropColumn("users", "failed_login_attempts");
        await queryRunner.dropTable("audit_logs");
    }

}
