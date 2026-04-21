import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddDepartmentIdToSaleSequences1776163392175 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
