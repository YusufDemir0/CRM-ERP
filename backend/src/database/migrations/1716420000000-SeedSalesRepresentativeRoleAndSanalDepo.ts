import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedSalesRepresentativeRoleAndSanalDepo1716420000000 implements MigrationInterface {
    name = 'SeedSalesRepresentativeRoleAndSanalDepo1716420000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Seed the 'Satış Yetkilisi' role if not exists
        await queryRunner.query(
            `INSERT IGNORE INTO \`roles\` (id, name, isSystemAdmin, state) VALUES (4, 'Satış Yetkilisi', 0, 1)`
        );

        // Fetch permissions we want to assign
        const permissionsToAssign = [
            'SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT',
            'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_EDIT',
            'FINANCE_VIEW',
            'INVENTORY_VIEW'
        ];

        // Fetch their IDs from the DB
        const keysList = permissionsToAssign.map(k => `'${k}'`).join(',');
        const dbPermissions = await queryRunner.query(
            `SELECT id, \`key\` FROM \`permissions\` WHERE \`key\` IN (${keysList})`
        );

        // Map role ID 4 permissions
        if (dbPermissions && dbPermissions.length > 0) {
            // Delete first to ensure fresh state
            await queryRunner.query(`DELETE FROM \`role_permissions\` WHERE role_id = 4`);

            for (const p of dbPermissions) {
                await queryRunner.query(
                    `INSERT IGNORE INTO \`role_permissions\` (role_id, permission_id) VALUES (4, ${p.id})`
                );
            }
        }

        // 2. Seed the 'sanaldepo' department if not exists
        const existingDept = await queryRunner.query(
            `SELECT id FROM \`departments\` WHERE \`name\` = 'sanaldepo' LIMIT 1`
        );

        if (!existingDept || existingDept.length === 0) {
            await queryRunner.query(
                `INSERT INTO \`departments\` (\`name\`, \`description\`, \`abbreviation\`, \`state\`) 
                 VALUES ('sanaldepo', 'Sanal Depo', 'SANAL', 1)`
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove 'Satış Yetkilisi' role permissions and role
        await queryRunner.query(`DELETE FROM \`role_permissions\` WHERE role_id = 4`);
        await queryRunner.query(`DELETE FROM \`roles\` WHERE id = 4`);

        // Remove 'sanaldepo' department
        await queryRunner.query(`DELETE FROM \`departments\` WHERE \`name\` = 'sanaldepo'`);
    }
}
