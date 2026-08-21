import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedDepartmentPermissions1780520000000 implements MigrationInterface {
    name = 'SeedDepartmentPermissions1780520000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const permissionsToSeed = [
            { key: 'DEPARTMENTS_PAGE', name: 'Departman Sayfa Erişimi', module: 'departments', action: 'read', description: 'Sol menüde Departmanlar sayfasını görebilme ve sayfaya erişebilme izni.' },
            { key: 'DEPARTMENTS_VIEW_ALL', name: 'Tüm Departmanları Gör', module: 'departments', action: 'read', description: 'Şirket genelindeki tüm departmanları ve departman tiplerini listeleyebilme.' },
            { key: 'DEPARTMENTS_CREATE', name: 'Departman Ekle', module: 'departments', action: 'create', description: 'Sisteme yeni bir departman veya departman tipi ekleyebilme.' },
            { key: 'DEPARTMENTS_EDIT', name: 'Departman Düzenle', module: 'departments', action: 'update', description: 'Mevcut departmanların veya departman tiplerinin adını/özelliklerini güncelleyebilme.' },
            { key: 'DEPARTMENTS_DELETE', name: 'Departman Sil', module: 'departments', action: 'delete', description: 'Kullanılmayan departman veya departman tiplerini silebilme.' }
        ];

        for (const perm of permissionsToSeed) {
            await queryRunner.query(
                `INSERT INTO \`permissions\` (\`key\`, \`name\`, \`module\`, \`action\`, \`description\`) 
                 VALUES (?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                 \`name\` = VALUES(\`name\`), 
                 \`module\` = VALUES(\`module\`), 
                 \`action\` = VALUES(\`action\`), 
                 \`description\` = VALUES(\`description\`)`,
                [perm.key, perm.name, perm.module, perm.action, perm.description]
            );
        }

        // Assign all new permissions to Admin role (ID=1)
        const adminRole = await queryRunner.query(`SELECT id FROM \`roles\` WHERE \`id\` = 1 LIMIT 1`);
        if (adminRole && adminRole.length > 0) {
            for (const perm of permissionsToSeed) {
                const permRow = await queryRunner.query(`SELECT id FROM \`permissions\` WHERE \`key\` = ? LIMIT 1`, [perm.key]);
                if (permRow && permRow.length > 0) {
                    await queryRunner.query(
                        `INSERT IGNORE INTO \`role_permissions\` (\`role_id\`, \`permission_id\`) VALUES (1, ?)`,
                        [permRow[0].id]
                    );
                }
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}
