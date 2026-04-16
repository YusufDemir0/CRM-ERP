"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrantAdminSystemPrivileges1776163392167 = void 0;
class GrantAdminSystemPrivileges1776163392167 {
    async up(queryRunner) {
        await queryRunner.query(`
            UPDATE roles 
            SET isSystemAdmin = true 
            WHERE name IN ('Admin', 'admin', 'Superadmin', 'superadmin')
        `);
        const permissions = [
            { key: 'system:manage', name: 'Sistem Yönetimi', module: 'system' },
            { key: 'yetki_atama', name: 'Yetki Atama', module: 'auth' },
            { key: 'yetki_goruntuleme', name: 'Yetki Görüntüleme', module: 'auth' }
        ];
        for (const perm of permissions) {
            const exists = await queryRunner.query(`SELECT id FROM permissions WHERE \`key\` = ?`, [perm.key]);
            if (exists.length === 0) {
                await queryRunner.query(`INSERT INTO permissions (\`key\`, name, module, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [perm.key, perm.name, perm.module]);
            }
        }
    }
    async down(queryRunner) {
        await queryRunner.query(`
            UPDATE roles 
            SET isSystemAdmin = false 
            WHERE name IN ('Admin', 'admin', 'Superadmin', 'superadmin')
        `);
    }
}
exports.GrantAdminSystemPrivileges1776163392167 = GrantAdminSystemPrivileges1776163392167;
//# sourceMappingURL=1776163392167-GrantAdminSystemPrivileges.js.map