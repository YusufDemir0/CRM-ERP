import { MigrationInterface, QueryRunner } from "typeorm";

// Sınıf ismindeki sayı 1776163392175 olmalı
export class AddDepartmentIdToSaleSequences1776163392175 implements MigrationInterface {
    name = 'AddDepartmentIdToSaleSequences1776163392175'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Tabloyu tamamen temizleyip departman bazlı yeni yapıda kuralım
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

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`sale_sequences\``);
    }
}
