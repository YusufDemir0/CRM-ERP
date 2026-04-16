import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsSystemAdminToRoles1776163392166 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE roles ADD COLUMN isSystemAdmin BOOLEAN NOT NULL DEFAULT FALSE AFTER name`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE roles DROP COLUMN isSystemAdmin`);
    }

}
