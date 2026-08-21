import { MigrationInterface, QueryRunner } from "typeorm";

export class RestoreMissingGranularPermissions1780550000000 implements MigrationInterface {
    name = 'RestoreMissingGranularPermissions1780550000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const permissionsToSeed = [
            // 🛍️ Satış Modülü (sales)
            { key: 'SALES_CREATE', name: 'Satış Siparişi Oluştur', module: 'sales', action: 'create', description: 'Yeni satış sihirbazını başlatıp taslak sipariş oluşturabilme.' },
            { key: 'SALES_APPROVE', name: 'Satış Siparişi Onayla', module: 'sales', action: 'manage', description: 'Taslak siparişi onaylayarak rezerve stoğu fiili stoğa dönüştürme.' },
            { key: 'SALES_CANCEL', name: 'Satış İptal Etme', module: 'sales', action: 'manage', description: 'Siparişi iptal ederek tüm stok ve bakiye hareketlerini geri döndürebilme.' },

            // 📦 Stok & Ürün Modülü (inventory)
            { key: 'INVENTORY_CREATE', name: 'Ürün Ekle', module: 'inventory', action: 'create', description: 'Sisteme yeni ham madde/ürün kartı ekleme yetkisi.' },
            { key: 'INVENTORY_EDIT', name: 'Ürün Kartı Düzenle', module: 'inventory', action: 'update', description: 'Genel ürün bilgilerini güncelleyebilme.' },
            { key: 'INVENTORY_DELETE', name: 'Ürün Kartı Sil', module: 'inventory', action: 'delete', description: 'İşlem görmemiş ürün kartlarını sistemden silebilme.' },

            // ⚙️ Üretim Modülü (production)
            { key: 'PRODUCTION_CREATE', name: 'Üretim Emri Başlat', module: 'production', action: 'create', description: 'Satışa bağlı veya serbest üretim iş emri oluşturabilme yetkisi.' },
            { key: 'PRODUCTION_EDIT', name: 'Üretim Emrini Güncelle', module: 'production', action: 'update', description: 'Üretim aşamasını, durumunu (planlandı, üretimde, durdu) ve fire oranlarını kaydetme.' },
            { key: 'PRODUCTION_DELETE', name: 'Üretim Emri İptal/Sil', module: 'production', action: 'delete', description: 'Başlamamış üretim emirlerini iptal edip silebilme izni.' }
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

        // 1. Assign all new permissions to Admin role (ID=1)
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

        // 2. Assign Sales permissions to SATIŞ role (ID=3)
        const satisRole = await queryRunner.query(`SELECT id FROM \`roles\` WHERE \`id\` = 3 LIMIT 1`);
        if (satisRole && satisRole.length > 0) {
            const salesKeys = ['SALES_CREATE', 'SALES_APPROVE', 'SALES_CANCEL'];
            for (const key of salesKeys) {
                const permRow = await queryRunner.query(`SELECT id FROM \`permissions\` WHERE \`key\` = ? LIMIT 1`, [key]);
                if (permRow && permRow.length > 0) {
                    await queryRunner.query(
                        `INSERT IGNORE INTO \`role_permissions\` (\`role_id\`, \`permission_id\`) VALUES (3, ?)`,
                        [permRow[0].id]
                    );
                }
            }
        }

        // 3. Assign Inventory and Production permissions to DEPO role (ID=4)
        const depoRole = await queryRunner.query(`SELECT id FROM \`roles\` WHERE \`id\` = 4 LIMIT 1`);
        if (depoRole && depoRole.length > 0) {
            const depoKeys = [
                'INVENTORY_PAGE', 'INVENTORY_VIEW_ALL', 'INVENTORY_CREATE', 'INVENTORY_EDIT', 'INVENTORY_DELETE',
                'PRODUCTION_PAGE', 'PRODUCTION_VIEW_ALL', 'PRODUCTION_CREATE', 'PRODUCTION_EDIT', 'PRODUCTION_DELETE'
            ];
            for (const key of depoKeys) {
                const permRow = await queryRunner.query(`SELECT id FROM \`permissions\` WHERE \`key\` = ? LIMIT 1`, [key]);
                if (permRow && permRow.length > 0) {
                    await queryRunner.query(
                        `INSERT IGNORE INTO \`role_permissions\` (\`role_id\`, \`permission_id\`) VALUES (4, ?)`,
                        [permRow[0].id]
                    );
                }
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Optional rollback logic
    }
}
