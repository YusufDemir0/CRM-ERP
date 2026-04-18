import { MigrationInterface, QueryRunner } from "typeorm";
export declare class RepairSchemaGaps1776163392173 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
