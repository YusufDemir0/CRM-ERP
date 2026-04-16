import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenVersionToUsers1776163392165 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 1 AFTER failed_login_attempts`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE users DROP COLUMN token_version`);
    }

}
