import { MigrationInterface, QueryRunner } from "typeorm";
export declare class SyncMissingColumns1776163392171 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
