import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOutboxTable1776163392177 implements MigrationInterface {
    name = 'AddOutboxTable1776163392177'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`outbox_events\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`topic\` varchar(255) NOT NULL,
                \`payload\` json NOT NULL,
                \`status\` enum('pending', 'processed', 'failed') NOT NULL DEFAULT 'pending',
                \`attempts\` int NOT NULL DEFAULT '0',
                \`error\` text NULL,
                \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`processed_at\` timestamp NULL,
                INDEX \`IDX_OUTBOX_STATUS\` (\`status\`),
                INDEX \`IDX_OUTBOX_CREATED\` (\`created_at\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_OUTBOX_CREATED\` ON \`outbox_events\``);
        await queryRunner.query(`DROP INDEX \`IDX_OUTBOX_STATUS\` ON \`outbox_events\``);
        await queryRunner.query(`DROP TABLE \`outbox_events\``);
    }
}
