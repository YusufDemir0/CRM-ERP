import { MigrationInterface, QueryRunner } from "typeorm";

export class GrantAdminSystemPrivileges1776163392167 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Admin rollerini isSystemAdmin = true olarak işaretle
        await queryRunner.query(`
            UPDATE roles 
            SET isSystemAdmin = true 
            WHERE name IN ('Admin', 'admin', 'Superadmin', 'superadmin')
        `);

        // 2. Eksik olabilecek kritik izinleri ekle
        // system:manage izni logs sayfasında @RequirePermissions('system:manage') olarak kullanılıyor
        const permissions = [
            { key: 'system:manage', name: 'Sistem Yönetimi', module: 'system' },
            { key: 'yetki_atama', name: 'Yetki Atama', module: 'auth' },
            { key: 'yetki_goruntuleme', name: 'Yetki Görüntüleme', module: 'auth' }
        ];

        for (const perm of permissions) {
            const exists = await queryRunner.query(`SELECT id FROM permissions WHERE \`key\` = ?`, [perm.key]);
            if (exists.length === 0) {
                await queryRunner.query(
                    `INSERT INTO permissions (\`key\`, name, module, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                    [perm.key, perm.name, perm.module]
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE roles 
            SET isSystemAdmin = false 
            WHERE name IN ('Admin', 'admin', 'Superadmin', 'superadmin')
        `);
    }

}
