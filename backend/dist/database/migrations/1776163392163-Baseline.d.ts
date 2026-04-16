import { MigrationInterface, QueryRunner } from "typeorm";
export declare class Baseline1776163392163 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
