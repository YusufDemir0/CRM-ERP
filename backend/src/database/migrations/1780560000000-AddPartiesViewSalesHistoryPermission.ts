import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPartiesViewSalesHistoryPermission1780560000000 implements MigrationInterface {
    name = 'AddPartiesViewSalesHistoryPermission1780560000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const perm = { 
            key: 'PARTIES_VIEW_SALES_HISTORY', 
            name: 'Müşteri Satış Geçmişini Gör', 
            module: 'parties', 
            action: 'read', 
            description: 'Müşteri detay ekranında geçmiş satış/tedarik siparişlerini ve cari hesap özetini görebilme.' 
        };

        // Insert the permission
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

        const permRow = await queryRunner.query(`SELECT id FROM \`permissions\` WHERE \`key\` = ? LIMIT 1`, [perm.key]);
        if (permRow && permRow.length > 0) {
            const permId = permRow[0].id;

            // 1. Map to Admin (role ID = 1)
            const adminRole = await queryRunner.query(`SELECT id FROM \`roles\` WHERE \`id\` = 1 LIMIT 1`);
            if (adminRole && adminRole.length > 0) {
                await queryRunner.query(
                    `INSERT IGNORE INTO \`role_permissions\` (\`role_id\`, \`permission_id\`) VALUES (1, ?)`,
                    [permId]
                );
            }

            // 2. Map to SATIŞ (role ID = 3)
            const satisRole = await queryRunner.query(`SELECT id FROM \`roles\` WHERE \`id\` = 3 LIMIT 1`);
            if (satisRole && satisRole.length > 0) {
                await queryRunner.query(
                    `INSERT IGNORE INTO \`role_permissions\` (\`role_id\`, \`permission_id\`) VALUES (3, ?)`,
                    [permId]
                );
            }

            // 3. Map to MUHASEBE (role ID = 5)
            const muhasebeRole = await queryRunner.query(`SELECT id FROM \`roles\` WHERE \`id\` = 5 LIMIT 1`);
            if (muhasebeRole && muhasebeRole.length > 0) {
                await queryRunner.query(
                    `INSERT IGNORE INTO \`role_permissions\` (\`role_id\`, \`permission_id\`) VALUES (5, ?)`,
                    [permId]
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback assignments
        await queryRunner.query(
            `DELETE FROM \`role_permissions\` WHERE \`permission_id\` IN (SELECT id FROM \`permissions\` WHERE \`key\` = 'PARTIES_VIEW_SALES_HISTORY')`
        );
        // Delete permission
        await queryRunner.query(
            `DELETE FROM \`permissions\` WHERE \`key\` = 'PARTIES_VIEW_SALES_HISTORY'`
        );
    }
}
