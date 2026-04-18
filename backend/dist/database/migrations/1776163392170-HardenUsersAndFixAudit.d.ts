import { MigrationInterface, QueryRunner } from "typeorm";
export declare class HardenUsersAndFixAudit1776163392170 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
