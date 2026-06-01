import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSalesMasterApprovePermission1716300000000 implements MigrationInterface {
    name = 'AddSalesMasterApprovePermission1716300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('SALES_MASTER_APPROVE','Yetkili Satış Onaylama','sales','manage')`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DELETE FROM \`permissions\` WHERE \`key\` = 'SALES_MASTER_APPROVE'`
        );
    }
}
