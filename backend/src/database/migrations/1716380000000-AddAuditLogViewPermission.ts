import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditLogViewPermission1716380000000 implements MigrationInterface {
    name = 'AddAuditLogViewPermission1716380000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('AUDIT_LOG_VIEW','Aktivite Loglarını Görüntüle','system','read')`
        );
        
        // Also assign this new permission to Admin (role_id = 1) if roles exist
        try {
            const permResult = await queryRunner.query(
                `SELECT id FROM \`permissions\` WHERE \`key\` = 'AUDIT_LOG_VIEW' LIMIT 1`
            );
            if (permResult && permResult.length > 0) {
                const permId = permResult[0].id;
                await queryRunner.query(
                    `INSERT IGNORE INTO \`role_permissions\` (role_id, permission_id) VALUES (1, ${permId})`
                );
            }
        } catch (e) {
            console.error("Failed to auto-assign AUDIT_LOG_VIEW permission to Admin role:", e);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            const permResult = await queryRunner.query(
                `SELECT id FROM \`permissions\` WHERE \`key\` = 'AUDIT_LOG_VIEW' LIMIT 1`
            );
            if (permResult && permResult.length > 0) {
                const permId = permResult[0].id;
                await queryRunner.query(
                    `DELETE FROM \`role_permissions\` WHERE permission_id = ${permId}`
                );
            }
        } catch (e) {}

        await queryRunner.query(
            `DELETE FROM \`permissions\` WHERE \`key\` = 'AUDIT_LOG_VIEW'`
        );
    }
}
