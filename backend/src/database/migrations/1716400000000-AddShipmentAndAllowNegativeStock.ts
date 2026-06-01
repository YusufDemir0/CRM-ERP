import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShipmentAndAllowNegativeStock1716400000000 implements MigrationInterface {
    name = 'AddShipmentAndAllowNegativeStock1716400000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop check constraints on stocks quantity safely
        try {
            const constraints = await queryRunner.query(
                `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
                 WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'stocks'`
            );
            for (const c of constraints) {
                try {
                    await queryRunner.query(`ALTER TABLE \`stocks\` DROP CHECK \`${c.CONSTRAINT_NAME}\``);
                } catch (err) {
                    console.error(`Failed to drop constraint ${c.CONSTRAINT_NAME}:`, err);
                }
            }
        } catch (e) {
            console.error("Failed to query CHECK constraints on stocks:", e);
            // Fallback: try default check constraint name
            try {
                await queryRunner.query(`ALTER TABLE \`stocks\` DROP CHECK \`quantity >= 0\``);
            } catch (err) {}
            try {
                await queryRunner.query(`ALTER TABLE \`stocks\` DROP CHECK \`stocks_chk_1\``);
            } catch (err) {}
        }

        // 2. Create shipments table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`shipments\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`sale_id\` bigint(20) NOT NULL,
              \`outgoing_department_id\` bigint(20) NOT NULL,
              \`delivery_city\` varchar(255) NOT NULL,
              \`delivery_district\` varchar(255) NOT NULL,
              \`delivery_address\` text NOT NULL,
              \`carrier_name_or_plate\` varchar(255) DEFAULT NULL,
              \`status\` enum('pending','shipped','completed','cancelled') NOT NULL DEFAULT 'pending',
              \`approved_at\` timestamp NULL DEFAULT NULL,
              \`deadline\` date NOT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`deleted_at\` timestamp(6) NULL DEFAULT NULL,
              PRIMARY KEY (\`id\`),
              KEY \`FK_shipments_sale\` (\`sale_id\`),
              KEY \`FK_shipments_dept\` (\`outgoing_department_id\`),
              CONSTRAINT \`FK_shipments_sale\` FOREIGN KEY (\`sale_id\`) REFERENCES \`sales\` (\`id\`) ON DELETE CASCADE,
              CONSTRAINT \`FK_shipments_dept\` FOREIGN KEY (\`outgoing_department_id\`) REFERENCES \`departments\` (\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 3. Seed permissions for shipments
        await queryRunner.query(
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES 
             ('SHIPMENT_VIEW', 'Sevkiyatları Görüntüle', 'inventory', 'read'),
             ('SHIPMENT_MANAGE', 'Sevkiyat Yönetimi', 'inventory', 'manage')`
        );

        // 4. Create Depo role if not exists
        await queryRunner.query(
            `INSERT IGNORE INTO \`roles\` (id, name, isSystemAdmin, state) VALUES (3, 'Depo', 0, 1)`
        );

        // 5. Auto-assign permissions to Admin (1) and Depo (3) roles
        try {
            const viewPerm = await queryRunner.query(
                `SELECT id FROM \`permissions\` WHERE \`key\` = 'SHIPMENT_VIEW' LIMIT 1`
            );
            const managePerm = await queryRunner.query(
                `SELECT id FROM \`permissions\` WHERE \`key\` = 'SHIPMENT_MANAGE' LIMIT 1`
            );

            if (viewPerm && viewPerm.length > 0) {
                const viewPermId = viewPerm[0].id;
                await queryRunner.query(`INSERT IGNORE INTO \`role_permissions\` (role_id, permission_id) VALUES (1, ${viewPermId})`);
                await queryRunner.query(`INSERT IGNORE INTO \`role_permissions\` (role_id, permission_id) VALUES (3, ${viewPermId})`);
            }

            if (managePerm && managePerm.length > 0) {
                const managePermId = managePerm[0].id;
                await queryRunner.query(`INSERT IGNORE INTO \`role_permissions\` (role_id, permission_id) VALUES (1, ${managePermId})`);
                await queryRunner.query(`INSERT IGNORE INTO \`role_permissions\` (role_id, permission_id) VALUES (3, ${managePermId})`);
            }
        } catch (e) {
            console.error("Failed to link shipment permissions to Admin/Depo roles:", e);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop shipments table
        await queryRunner.query(`DROP TABLE IF EXISTS \`shipments\``);

        // Remove permissions from role assignments
        try {
            const perms = await queryRunner.query(
                `SELECT id FROM \`permissions\` WHERE \`key\` IN ('SHIPMENT_VIEW', 'SHIPMENT_MANAGE')`
            );
            for (const p of perms) {
                await queryRunner.query(`DELETE FROM \`role_permissions\` WHERE permission_id = ${p.id}`);
            }
        } catch (e) {}

        // Remove permissions
        await queryRunner.query(`DELETE FROM \`permissions\` WHERE \`key\` IN ('SHIPMENT_VIEW', 'SHIPMENT_MANAGE')`);
    }
}
