"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAuditLogViewPermission1716380000000 = void 0;
class AddAuditLogViewPermission1716380000000 {
    constructor() {
        this.name = 'AddAuditLogViewPermission1716380000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('AUDIT_LOG_VIEW','Aktivite Loglarını Görüntüle','system','read')`);
        try {
            const permResult = await queryRunner.query(`SELECT id FROM \`permissions\` WHERE \`key\` = 'AUDIT_LOG_VIEW' LIMIT 1`);
            if (permResult && permResult.length > 0) {
                const permId = permResult[0].id;
                await queryRunner.query(`INSERT IGNORE INTO \`role_permissions\` (role_id, permission_id) VALUES (1, ${permId})`);
            }
        }
        catch (e) {
            console.error("Failed to auto-assign AUDIT_LOG_VIEW permission to Admin role:", e);
        }
    }
    async down(queryRunner) {
        try {
            const permResult = await queryRunner.query(`SELECT id FROM \`permissions\` WHERE \`key\` = 'AUDIT_LOG_VIEW' LIMIT 1`);
            if (permResult && permResult.length > 0) {
                const permId = permResult[0].id;
                await queryRunner.query(`DELETE FROM \`role_permissions\` WHERE permission_id = ${permId}`);
            }
        }
        catch (e) { }
        await queryRunner.query(`DELETE FROM \`permissions\` WHERE \`key\` = 'AUDIT_LOG_VIEW'`);
    }
}
exports.AddAuditLogViewPermission1716380000000 = AddAuditLogViewPermission1716380000000;
//# sourceMappingURL=1716380000000-AddAuditLogViewPermission.js.map