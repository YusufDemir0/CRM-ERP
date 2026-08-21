import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFinanceSelectAndRenameSalesMasterView1780490000000 implements MigrationInterface {
    name = 'AddFinanceSelectAndRenameSalesMasterView1780490000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Seed FINANCE_SELECT
        const perm = {
            key: 'FINANCE_SELECT',
            name: 'Satış Kasa Seçim İzni (Checkout)',
            module: 'finance',
            action: 'manage',
            description: 'Kullanıcının sadece satış sırasında tahsilat kasasını seçebilmesini sağlar.'
        };

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

        // 2. Update SALES_MASTER_VIEW name to mention mastersale
        await queryRunner.query(
            `UPDATE \`permissions\` 
             SET \`name\` = 'Tüm Şirket Satışlarını İzleme (Mastersale)' 
             WHERE \`key\` = 'SALES_MASTER_VIEW'`
        );

        // 3. Assign to Admin role (ID=1)
        const adminRole = await queryRunner.query(`SELECT id FROM \`roles\` WHERE \`id\` = 1 LIMIT 1`);
        if (adminRole && adminRole.length > 0) {
            const permRow = await queryRunner.query(`SELECT id FROM \`permissions\` WHERE \`key\` = 'FINANCE_SELECT' LIMIT 1`);
            if (permRow && permRow.length > 0) {
                await queryRunner.query(
                    `INSERT IGNORE INTO \`role_permissions\` (\`role_id\`, \`permission_id\`) VALUES (1, ?)`,
                    [permRow[0].id]
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DELETE FROM \`role_permissions\` WHERE \`permission_id\` IN (SELECT id FROM \`permissions\` WHERE \`key\` = 'FINANCE_SELECT')`
        );
        await queryRunner.query(
            `DELETE FROM \`permissions\` WHERE \`key\` = 'FINANCE_SELECT'`
        );
        await queryRunner.query(
            `UPDATE \`permissions\` 
             SET \`name\` = 'Tüm Şirket Satışlarını İzleme' 
             WHERE \`key\` = 'SALES_MASTER_VIEW'`
        );
    }
}
