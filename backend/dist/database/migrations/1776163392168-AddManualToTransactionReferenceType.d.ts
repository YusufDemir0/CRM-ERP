import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddManualToTransactionReferenceType1776163392168 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
