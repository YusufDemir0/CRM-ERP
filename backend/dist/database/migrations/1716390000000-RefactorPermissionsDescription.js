"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefactorPermissionsDescription1716390000000 = void 0;
class RefactorPermissionsDescription1716390000000 {
    constructor() {
        this.name = 'RefactorPermissionsDescription1716390000000';
    }
    async up(queryRunner) {
        const hasColumn = await queryRunner.hasColumn("permissions", "description");
        if (!hasColumn) {
            await queryRunner.query(`ALTER TABLE \`permissions\` ADD \`description\` TEXT NULL`);
        }
        await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 0;`);
        await queryRunner.query(`DELETE FROM \`permissions\` WHERE \`module\` = 'SATIŞ' OR \`module\` = 'satış' OR \`key\` = 'SALES_MASTER_APPROVE_LEGACY'`);
        await queryRunner.query(`DELETE FROM \`role_permissions\` WHERE \`permission_id\` NOT IN (SELECT \`id\` FROM \`permissions\`)`);
        await queryRunner.query(`DELETE FROM \`user_permissions\` WHERE \`permission_id\` NOT IN (SELECT \`id\` FROM \`permissions\`)`);
        await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 1;`);
        const permissionsToSeed = [
            { key: 'SALES_VIEW', name: 'Satış Siparişlerini Görüntüle', module: 'sales', action: 'read', description: 'Kullanıcının sadece kendi oluşturduğu satış siparişlerini ve durumlarını görüntülemesini sağlar.' },
            { key: 'SALES_CREATE', name: 'Satış Siparişi Oluştur', module: 'sales', action: 'create', description: 'Kullanıcının yeni bir taslak satış siparişi oluşturmasını sağlar.' },
            { key: 'SALES_EDIT', name: 'Satış Siparişi Düzenle', module: 'sales', action: 'update', description: 'Kullanıcının kendi oluşturduğu taslak durumundaki satış siparişlerini güncellemesini sağlar.' },
            { key: 'SALES_APPROVE', name: 'Satış Siparişi Onayla', module: 'sales', action: 'manage', description: 'Kullanıcının satış siparişlerini onaylayarak stok düşümü gerçekleştirmesini sağlar.' },
            { key: 'SALES_CANCEL', name: 'Satış Siparişi İptal Et', module: 'sales', action: 'manage', description: 'Kullanıcının satış siparişlerini iptal ederek ilgili stok ve bakiye hareketlerini geri almasını sağlar.' },
            { key: 'SALES_DELETE', name: 'Satış Siparişi Sil', module: 'sales', action: 'delete', description: 'Kullanıcının taslak durumundaki satış siparişlerini sistemden tamamen silmesini sağlar.' },
            { key: 'SALES_MASTER_VIEW', name: 'Tüm Şirket Satışlarını İzleme', module: 'sales', action: 'read', description: 'Kullanıcının kendisinden bağımsız, tüm şirketin satış siparişlerini tek bir ekranda görmesini ve Master Satışlar sayfasına erişmesini sağlar.' },
            { key: 'SALES_MASTER_APPROVE', name: 'Yetkili Satış Onaylama (Master)', module: 'sales', action: 'manage', description: 'Kullanıcının Master Satışlar sayfasından tüm siparişleri departman/depo bazlı stok tahsisi yaparak onaylamasını sağlar.' },
            { key: 'SALES_MASTER_SHIP', name: 'Yetkili Satış Sevk Etme (Master)', module: 'sales', action: 'manage', description: 'Kullanıcının onaylanmış tüm satış siparişlerinin sevkiyat işlemlerini yapabilmesini sağlar.' },
            { key: 'SALES_MASTER_CANCEL', name: 'Yetkili Satış İptal Etme (Master)', module: 'sales', action: 'manage', description: 'Kullanıcının herhangi bir kullanıcının satış siparişini iptal edebilmesini sağlar.' },
            { key: 'CUSTOMER_VIEW', name: 'Carileri Görüntüle', module: 'parties', action: 'read', description: 'Müşteri ve tedarikçi cari hesap kartlarının listesini ve temel bakiye bilgilerini görmeyi sağlar.' },
            { key: 'CUSTOMER_CREATE', name: 'Cari Hesap Ekle', module: 'parties', action: 'create', description: 'Sisteme yeni müşteri veya tedarikçi cari kartı tanımlamayı sağlar.' },
            { key: 'CUSTOMER_EDIT', name: 'Cari Hesap Düzenle', module: 'parties', action: 'update', description: 'Mevcut müşteri/tedarikçi cari bilgilerini, adreslerini ve risk limitlerini güncellemeyi sağlar.' },
            { key: 'CUSTOMER_DELETE', name: 'Cari Hesap Sil', module: 'parties', action: 'delete', description: 'Pasif durumdaki müşteri veya tedarikçi cari kartlarını sistemden silmeyi sağlar.' },
            { key: 'INVENTORY_VIEW', name: 'Stok & Ürünleri Görüntüle', module: 'inventory', action: 'read', description: 'Ürün kartlarını, depo stok miktarlarını ve kritik limit durumlarını izlemeyi sağlar.' },
            { key: 'INVENTORY_CREATE', name: 'Ürün Ekle', module: 'inventory', action: 'create', description: 'Sisteme yeni bir ham madde, yarı mamul veya mamul ürün kartı tanımlamayı sağlar.' },
            { key: 'INVENTORY_EDIT', name: 'Stok & Ürün Düzenle', module: 'inventory', action: 'update', description: 'Ürün fiyatları, KDV oranları, kod grupları ve kritik limit tanımlarını güncellemeyi sağlar.' },
            { key: 'INVENTORY_DELETE', name: 'Ürün Kartı Sil', module: 'inventory', action: 'delete', description: 'İşlem görmemiş veya pasif durumdaki ürün kartlarını sistemden silmeyi sağlar.' },
            { key: 'FINANCE_VIEW', name: 'Finansal Hareketleri Gör', module: 'finance', action: 'read', description: 'Banka hesap hareketlerini, cari ödeme/tahsilat geçmişini ve kasa durumlarını izlemeyi sağlar.' },
            { key: 'FINANCE_MANAGE', name: 'Finansal İşlem Yap (Ödeme/Tahsilat)', module: 'finance', action: 'manage', description: 'Cari hesaplara borç/alacak kaydı girmeyi, banka transferi yapmayı ve nakit tahsilat/ödeme kaydetmeyi sağlar.' },
            { key: 'PRODUCTION_VIEW', name: 'Üretim Emirlerini Gör', module: 'production', action: 'read', description: 'Aktif, planlanan ve tamamlanan üretim emirlerinin durumlarını ve maliyetlerini izlemeyi sağlar.' },
            { key: 'PRODUCTION_CREATE', name: 'Üretim Emri Oluştur', module: 'production', action: 'create', description: 'Yeni bir mamul üretimi için iş emri oluşturmayı ve ürün reçetesi (BOM) atamayı sağlar.' },
            { key: 'PRODUCTION_EDIT', name: 'Üretim Emri Düzenle', module: 'production', action: 'update', description: 'Üretim miktarlarını, departman tahsislerini, başlangıç/bitiş tarihlerini ve durumlarını güncellemeyi sağlar.' },
            { key: 'PRODUCTION_DELETE', name: 'Üretim Emri Sil', module: 'production', action: 'delete', description: 'Planlanan veya taslak aşamasındaki üretim iş emirlerini iptal edip silmeyi sağlar.' },
            { key: 'USER_VIEW', name: 'Kullanıcıları Gör', module: 'users', action: 'read', description: 'Sistemde tanımlı tüm personel ve kullanıcı hesaplarının listesini ve durumlarını görmeyi sağlar.' },
            { key: 'USER_CREATE', name: 'Kullanıcı Oluştur', module: 'users', action: 'create', description: 'Sisteme giriş yapabilecek yeni kullanıcı hesapları ve personel tanımları eklemeyi sağlar.' },
            { key: 'USER_EDIT', name: 'Kullanıcı Düzenle', module: 'users', action: 'update', description: 'Kullanıcıların şifre sıfırlama, departman değişikliği ve hesap kilit açma işlemlerini yapmayı sağlar.' },
            { key: 'USER_DELETE', name: 'Kullanıcı Sil', module: 'users', action: 'delete', description: 'Kullanıcı hesaplarını tamamen silmeyi veya erişimlerini kalıcı olarak engellemeyi sağlar.' },
            { key: 'ROLE_VIEW', name: 'Rolleri Gör', module: 'roles', action: 'read', description: 'Sistemdeki mevcut rol profillerini (Admin, Depo, Satış vb.) ve izin matrislerini görmeyi sağlar.' },
            { key: 'ROLE_CREATE', name: 'Rol Oluştur', module: 'roles', action: 'create', description: 'Sisteme yeni bir yetki profili/rol (örn. PLANLAMA SORUMLUSU) tanımlamayı sağlar.' },
            { key: 'ROLE_EDIT', name: 'Rol Düzenle', module: 'roles', action: 'update', description: 'Mevcut rollerin izin matrislerini ve yetki kapsamlarını güncellemeyi sağlar.' },
            { key: 'ROLE_DELETE', name: 'Rol Sil', module: 'roles', action: 'delete', description: 'Kullanılmayan yetki profillerini/rollerini sistemden silmeyi sağlar.' },
            { key: 'ROLE_ASSIGN', name: 'Rol Ata', module: 'roles', action: 'manage', description: 'Kullanıcılara/personellere yetki profilleri ve roller atamayı sağlar.' },
            { key: 'PERMISSION_VIEW', name: 'Detaylı Yetkileri Gör', module: 'roles', action: 'read', description: 'Tüm alt sistem yetkilerinin teknik detaylarını ve override matrislerini listelemeyi sağlar.' },
            { key: 'PERMISSION_ASSIGN', name: 'Kullanıcı Yetki Override (Özel İzin)', module: 'roles', action: 'manage', description: 'Belirli bir kullanıcıya, rolünden bağımsız olarak özel ek izin vermeyi veya kısıtlama (deny) getirmeyi sağlar.' },
            { key: 'SYSTEM_MANAGE', name: 'Genel Sistem Yönetimi', module: 'system', action: 'manage', description: 'Döviz kurları, şirket bilgileri, genel parametre ayarları ve veri tabanı yedekleme işlemlerini yapmayı sağlar.' },
            { key: 'AUDIT_LOG_VIEW', name: 'Sistem Loglarını Gör', module: 'system', action: 'read', description: 'İşletme genelinde hangi kullanıcının, hangi tarihte, hangi IP\'den, ne tür bir iş işlemi (ekleme, onay, silme vb.) gerçekleştirdiğini adım adım izlemeyi sağlar.' }
        ];
        for (const perm of permissionsToSeed) {
            await queryRunner.query(`INSERT INTO \`permissions\` (\`key\`, \`name\`, \`module\`, \`action\`, \`description\`) 
                 VALUES (?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                 \`name\` = VALUES(\`name\`), 
                 \`module\` = VALUES(\`module\`), 
                 \`action\` = VALUES(\`action\`), 
                 \`description\` = VALUES(\`description\`)`, [perm.key, perm.name, perm.module, perm.action, perm.description]);
        }
        const adminRole = await queryRunner.query(`SELECT id FROM \`roles\` WHERE \`id\` = 1 LIMIT 1`);
        if (adminRole && adminRole.length > 0) {
            const newKeys = ['SALES_MASTER_VIEW', 'SALES_MASTER_APPROVE', 'SALES_MASTER_SHIP', 'SALES_MASTER_CANCEL'];
            for (const key of newKeys) {
                const permRow = await queryRunner.query(`SELECT id FROM \`permissions\` WHERE \`key\` = ? LIMIT 1`, [key]);
                if (permRow && permRow.length > 0) {
                    await queryRunner.query(`INSERT IGNORE INTO \`role_permissions\` (\`role_id\`, \`permission_id\`) VALUES (1, ?)`, [permRow[0].id]);
                }
            }
        }
    }
    async down(queryRunner) {
        await queryRunner.query(`DELETE FROM \`role_permissions\` WHERE \`permission_id\` IN (SELECT id FROM \`permissions\` WHERE \`key\` IN ('SALES_MASTER_VIEW', 'SALES_MASTER_SHIP', 'SALES_MASTER_CANCEL'))`);
        await queryRunner.query(`DELETE FROM \`permissions\` WHERE \`key\` IN ('SALES_MASTER_VIEW', 'SALES_MASTER_SHIP', 'SALES_MASTER_CANCEL')`);
        const hasColumn = await queryRunner.hasColumn("permissions", "description");
        if (hasColumn) {
            await queryRunner.query(`ALTER TABLE \`permissions\` DROP COLUMN \`description\``);
        }
    }
}
exports.RefactorPermissionsDescription1716390000000 = RefactorPermissionsDescription1716390000000;
//# sourceMappingURL=1716390000000-RefactorPermissionsDescription.js.map