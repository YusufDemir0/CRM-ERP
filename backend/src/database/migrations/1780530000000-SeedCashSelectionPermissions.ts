import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedCashSelectionPermissions1780530000000 implements MigrationInterface {
    name = 'SeedCashSelectionPermissions1780530000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const permissionsToSeed = [
            { key: 'FINANCE_SELECT_ALL_CASH', name: 'Satışta Tüm Kasaları Seçebilme', module: 'finance', action: 'manage', description: 'Satış sırasında departmanından bağımsız olarak şirketteki tüm kasaları görüp seçebilme yetkisi.' },
            { key: 'FINANCE_SELECT_DEPT_CASH', name: 'Satışta Departman Kasalarını Seçebilme', module: 'finance', action: 'manage', description: 'Satış sırasında sadece kendi departmanına bağlı kasaları görüp seçebilme yetkisi.' }
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
