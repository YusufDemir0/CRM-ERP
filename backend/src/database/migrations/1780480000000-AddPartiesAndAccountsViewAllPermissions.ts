import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPartiesAndAccountsViewAllPermissions1780480000000 implements MigrationInterface {
    name = 'AddPartiesAndAccountsViewAllPermissions1780480000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const permissionsToSeed = [
            { 
                key: 'PARTIES_VIEW_ALL', 
                name: 'Tüm Carileri Görüntüle', 
                module: 'parties', 
                action: 'read', 
                description: 'Kullanıcının departman kısıtlaması olmaksızın tüm cari hesap kartlarını görüntülemesini sağlar.' 
            },
            { 
                key: 'ACCOUNTS_VIEW_ALL', 
                name: 'Tüm Kasaları Görüntüle', 
                module: 'finance', 
                action: 'read', 
                description: 'Kullanıcının departman kısıtlaması olmaksızın tüm ticari banka ve kasa hesaplarını görüntülemesini sağlar.' 
            }
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

        // Assign to Admin role (ID=1)
        const adminRole = await queryRunner.query(`SELECT id FROM \`roles\` WHERE \`id\` = 1 LIMIT 1`);
        if (adminRole && adminRole.length > 0) {
            const keysToAssign = ['PARTIES_VIEW_ALL', 'ACCOUNTS_VIEW_ALL'];
            for (const key of keysToAssign) {
                const permRow = await queryRunner.query(`SELECT id FROM \`permissions\` WHERE \`key\` = ? LIMIT 1`, [key]);
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
        await queryRunner.query(
            `DELETE FROM \`role_permissions\` WHERE \`permission_id\` IN (SELECT id FROM \`permissions\` WHERE \`key\` IN ('PARTIES_VIEW_ALL', 'ACCOUNTS_VIEW_ALL'))`
        );
        await queryRunner.query(
            `DELETE FROM \`permissions\` WHERE \`key\` IN ('PARTIES_VIEW_ALL', 'ACCOUNTS_VIEW_ALL')`
        );
    }
}
