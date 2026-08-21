import { MigrationInterface, QueryRunner } from "typeorm";

export class CleanupOldPermissions1780540000000 implements MigrationInterface {
    name = 'CleanupOldPermissions1780540000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const oldKeys = [
            'SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT', 'SALES_APPROVE', 'SALES_CANCEL', 'SALES_DELETE',
            'SALES_MASTER_VIEW', 'SALES_MASTER_APPROVE', 'SALES_MASTER_SHIP', 'SALES_MASTER_CANCEL',
            'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_EDIT', 'CUSTOMER_DELETE',
            'INVENTORY_VIEW', 'INVENTORY_CREATE', 'INVENTORY_EDIT', 'INVENTORY_DELETE',
            'FINANCE_VIEW', 'FINANCE_MANAGE',
            'PRODUCTION_VIEW', 'PRODUCTION_CREATE', 'PRODUCTION_EDIT', 'PRODUCTION_DELETE',
            'USER_VIEW', 'USER_CREATE', 'USER_EDIT', 'USER_DELETE',
            'ROLE_VIEW', 'ROLE_CREATE', 'ROLE_EDIT', 'ROLE_DELETE', 'ROLE_ASSIGN',
            'PERMISSION_VIEW', 'PERMISSION_ASSIGN',
            'SYSTEM_MANAGE', 'AUDIT_LOG_VIEW',
            'ACCOUNTS_VIEW_ALL', 'FINANCE_SELECT'
        ];

        for (const key of oldKeys) {
            // First, delete role assignment links
            await queryRunner.query(
                `DELETE FROM \`role_permissions\` WHERE \`permission_id\` IN (SELECT id FROM \`permissions\` WHERE \`key\` = ?)`,
                [key]
            );
            // Second, delete user permission overrides (if any)
            await queryRunner.query(
                `DELETE FROM \`user_permissions\` WHERE \`permission_id\` IN (SELECT id FROM \`permissions\` WHERE \`key\` = ?)`,
                [key]
            );
            // Finally, delete the permission itself
            await queryRunner.query(
                `DELETE FROM \`permissions\` WHERE \`key\` = ?`,
                [key]
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No down migration needed for cleanup
    }
}
