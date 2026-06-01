import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddAuditLogViewPermission1716380000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
