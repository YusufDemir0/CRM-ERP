import { MigrationInterface, QueryRunner } from "typeorm";
export declare class SyncSaleItemsColumns1776163392172 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
