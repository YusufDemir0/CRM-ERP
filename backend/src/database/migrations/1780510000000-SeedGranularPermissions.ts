import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedGranularPermissions1780510000000 implements MigrationInterface {
    name = 'SeedGranularPermissions1780510000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const permissionsToSeed = [
            // 👥 Cari Modülü (parties)
            { key: 'PARTIES_PAGE', name: 'Cari Sayfa Erişimi', module: 'parties', action: 'read', description: 'Sol menüde Cariler sayfasını görebilme ve sayfaya erişebilme izni.' },
            { key: 'PARTIES_VIEW_OWN', name: 'Kendi Carilerini Gör', module: 'parties', action: 'read', description: 'Sadece kullanıcının kendi oluşturduğu cari kartları listeleyebilme.' },
            { key: 'PARTIES_VIEW_DEPT', name: 'Departman Carilerini Gör', module: 'parties', action: 'read', description: 'Kendi departmanındaki kullanıcılar tarafından oluşturulan carileri listeleyebilme.' },
            { key: 'PARTIES_VIEW_ALL', name: 'Tüm Carileri Gör', module: 'parties', action: 'read', description: 'Şirket genelindeki tüm carileri ve bakiyelerini listeleyebilme.' },
            { key: 'PARTIES_CREATE', name: 'Cari Kart Ekle', module: 'parties', action: 'create', description: 'Yeni müşteri veya tedarikçi cari kartı oluşturabilme izni.' },
            { key: 'PARTIES_EDIT_OWN', name: 'Kendi Carilerini Düzenle', module: 'parties', action: 'update', description: 'Sadece kendi oluşturduğu cari kart bilgilerini güncelleyebilme.' },
            { key: 'PARTIES_EDIT_ALL', name: 'Tüm Carileri Düzenle', module: 'parties', action: 'update', description: 'Herhangi bir cari kartın bilgilerini güncelleyebilme.' },
            { key: 'PARTIES_DELETE', name: 'Cari Kart Sil', module: 'parties', action: 'delete', description: 'İşlem görmemiş pasif cari kartlarını silebilme yetkisi.' },
            { key: 'PARTIES_USE_SELECTION', name: 'Satışta Cari Seçebilme', module: 'parties', action: 'read', description: 'Cari listesine gitmeden, satış sihirbazında cari arayıp seçebilme izni.' },

            // 💰 Hesaplar / Finans Modülü (finance)
            { key: 'FINANCE_PAGE', name: 'Finans Sayfa Erişimi', module: 'finance', action: 'read', description: 'Sol menüde Hesaplar/Kasa sayfasını görebilme ve sayfaya erişebilme izni.' },
            { key: 'FINANCE_VIEW_DEPT', name: 'Departman Kasalarını Gör', module: 'finance', action: 'read', description: 'Sadece kullanıcının departmanına atanmış kasaları ve bakiyelerini görebilme.' },
            { key: 'FINANCE_VIEW_ALL', name: 'Tüm Kasaları Gör', module: 'finance', action: 'read', description: 'Şirket genelindeki tüm kasa ve bankaları, bakiyeleriyle görebilme.' },
            { key: 'FINANCE_CREATE', name: 'Yeni Kasa/Banka Tanımla', module: 'finance', action: 'create', description: 'Sisteme yeni bir kasa veya banka hesabı ekleyebilme izni.' },
            { key: 'FINANCE_EDIT', name: 'Kasa Bilgisi Düzenle', module: 'finance', action: 'update', description: 'Kasa adı, IBAN, para birimi vb. bilgilerini güncelleyebilme.' },
            { key: 'FINANCE_DELETE', name: 'Kasa Sil', module: 'finance', action: 'delete', description: 'Kullanılmayan kasa hesaplarını silebilme izni.' },
            { key: 'FINANCE_VIEW_LEDGER', name: 'Kasa Hareketlerini Gör', module: 'finance', action: 'read', description: 'Kasalara ait detaylı giriş-çıkış raporlarını görebilme.' },
            { key: 'FINANCE_RECEIVE_PAYMENT', name: 'Tahsilat Al (Para Girişi)', module: 'finance', action: 'manage', description: 'Müşterilerden kapora veya cari tahsilat (nakit, havale vb.) kaydetme yetkisi.' },
            { key: 'FINANCE_MAKE_PAYMENT', name: 'Ödeme Yap (Para Çıkışı)', module: 'finance', action: 'manage', description: 'Tedarikçilere veya masraflara yönelik ödeme çıkışı kaydetme yetkisi.' },
            { key: 'FINANCE_TRANSFER', name: 'Kasa Transferi (Virman)', module: 'finance', action: 'manage', description: 'Banka ve kasa hesapları arasında para transferi/virman yapabilme yetkisi.' },
            { key: 'FINANCE_RECONCILE', name: 'Hesap Mutabakatı', module: 'finance', action: 'manage', description: 'Kasa/banka bakiyelerini doğrulama, mutabakat yapma ve hesapları eşleştirme yetkisi.' },
            { key: 'FINANCE_USE_SELECTION', name: 'Satışta Kasa Seçebilme', module: 'finance', action: 'read', description: 'Kasa sayfasına yetkisi olmasa bile satış/kapora esnasında tüm aktif kasaları listede görüp seçebilme.' },

            // 🛍️ Satış Modülü (sales)
            { key: 'SALES_PAGE', name: 'Satış Sayfa Erişimi', module: 'sales', action: 'read', description: 'Sol menüde Satışlar sayfasını görebilme.' },
            { key: 'SALES_VIEW_OWN', name: 'Kendi Satışlarını Gör', module: 'sales', action: 'read', description: 'Yalnızca kendi oluşturduğu satış siparişlerini listeleme.' },
            { key: 'SALES_VIEW_DEPT', name: 'Departman Satışlarını Gör', module: 'sales', action: 'read', description: 'Kendi departmanına ait satış siparişlerini izleme.' },
            { key: 'SALES_VIEW_ALL', name: 'Tüm Şirket Satışlarını Gör', module: 'sales', action: 'read', description: 'Master Satışlar sayfasına erişip tüm şirket satış siparişlerini görebilme.' },
            { key: 'SALES_CREATE', name: 'Satış Siparişi Oluştur', module: 'sales', action: 'create', description: 'Yeni satış sihirbazını başlatıp taslak sipariş oluşturabilme.' },
            { key: 'SALES_EDIT_OWN', name: 'Kendi Satışını Düzenle', module: 'sales', action: 'update', description: 'Kendi oluşturduğu taslak durumundaki siparişleri güncelleyebilme.' },
            { key: 'SALES_EDIT_ALL', name: 'Herhangi bir Satışı Düzenle', module: 'sales', action: 'update', description: 'Master satışlar ekranından başka temsilcilerin siparişlerini düzenleyebilme.' },
            { key: 'SALES_DELETE_OWN', name: 'Kendi Taslak Satışını Sil', module: 'sales', action: 'delete', description: 'Kendi oluşturduğu taslak siparişleri silebilme.' },
            { key: 'SALES_APPROVE', name: 'Satış Siparişi Onayla', module: 'sales', action: 'manage', description: 'Taslak siparişi onaylayarak rezerve stoğu fiili stoğa dönüştürme.' },
            { key: 'SALES_APPROVE_DISCOUNT', name: 'İskontolu Satış Onaylama', module: 'sales', action: 'manage', description: 'Satışta uygulanan ekstra iskonto/indirim oranlarını/turtarlarını onaylayabilme yetkisi.' },
            { key: 'SALES_APPROVE_OVER_LIMIT', name: 'Limit Aşım Onayı', module: 'sales', action: 'manage', description: 'Müşterinin cari risk/kredi limiti aşılmış olsa dahi satışı onaylayabilme yetkisi.' },
            { key: 'SALES_SHIP', name: 'Satış Sevk Etme', module: 'sales', action: 'manage', description: 'Onaylı siparişlerin sevkiyat işlemlerini (fatura altı nakliye/adres) yönetebilme.' },
            { key: 'SALES_CANCEL', name: 'Satış İptal Etme', module: 'sales', action: 'manage', description: 'Siparişi iptal ederek tüm stok ve bakiye hareketlerini geri döndürebilme.' },

            // 📦 Stok & Ürün Modülü (inventory)
            { key: 'INVENTORY_PAGE', name: 'Stok Sayfa Erişimi', module: 'inventory', action: 'read', description: 'Stoklar & Ürünler sayfasını görebilme.' },
            { key: 'INVENTORY_VIEW_DEPT', name: 'Departman Depo Stokunu Gör', module: 'inventory', action: 'read', description: 'Sadece kullanıcının bağlı olduğu departmanın deposundaki ürün miktarlarını izleme.' },
            { key: 'INVENTORY_VIEW_ALL', name: 'Tüm Depo Stoklarını Gör', module: 'inventory', action: 'read', description: 'Tüm depoların stok kartlarını, miktarlarını ve kritik limit durumlarını izleme.' },
            { key: 'INVENTORY_CREATE', name: 'Ürün Ekle', module: 'inventory', action: 'create', description: 'Sisteme yeni ham madde/ürün kartı ekleme yetkisi.' },
            { key: 'INVENTORY_EDIT', name: 'Ürün Kartı Düzenle', module: 'inventory', action: 'update', description: 'Genel ürün bilgilerini güncelleyebilme.' },
            { key: 'INVENTORY_EDIT_PRICE', name: 'Satış Fiyatlarını Düzenle', module: 'inventory', action: 'update', description: 'Ürün kartlarındaki aktif satış fiyatlarını değiştirme ve belirleme yetkisi.' },
            { key: 'INVENTORY_EDIT_COST', name: 'Alış/Maliyet Fiyatını Düzenle', module: 'inventory', action: 'update', description: 'Ürün alış fiyatları, maliyetler ve hammadde birim maliyetlerini görme ve düzenleme yetkisi.' },
            { key: 'INVENTORY_EDIT_STOCK_LIMIT', name: 'Stok Limitlerini Düzenle', module: 'inventory', action: 'update', description: 'Ürünlerin depolardaki kritik limit (minimum/maksimum stok) tanımlarını güncelleme yetkisi.' },
            { key: 'INVENTORY_DELETE', name: 'Ürün Kartı Sil', module: 'inventory', action: 'delete', description: 'İşlem görmemiş ürün kartlarını sistemden silebilme.' },
            { key: 'INVENTORY_USE_SELECTION', name: 'Satışta Ürün Seçebilme', module: 'inventory', action: 'read', description: 'Satış sihirbazında sepet oluştururken ürün arayıp ekleyebilme yetkisi.' },

            // ⚙️ Üretim Modülü (production)
            { key: 'PRODUCTION_PAGE', name: 'Üretim Sayfa Erişimi', module: 'production', action: 'read', description: 'Sol menüde Üretim modülüne ve iş emirleri paneline erişebilme.' },
            { key: 'PRODUCTION_VIEW_OWN', name: 'Atandığı İş Emirlerini Gör', module: 'production', action: 'read', description: 'Sadece kullanıcının kendine atanmış veya kendisinin başlattığı iş emirlerini görmesi.' },
            { key: 'PRODUCTION_VIEW_DEPT', name: 'Departman İş Emirlerini Gör', module: 'production', action: 'read', description: 'Kendi departmanına (örn. Plastik Hattı, Montaj) atanmış iş emirlerini listeleme.' },
            { key: 'PRODUCTION_VIEW_ALL', name: 'Tüm Üretim İş Emirlerini Gör', module: 'production', action: 'read', description: 'Şirket genelindeki tüm üretim hatlarını ve iş emirlerini izleyebilme.' },
            { key: 'PRODUCTION_CREATE', name: 'Üretim Emri Başlat', module: 'production', action: 'create', description: 'Satışa bağlı veya serbest üretim iş emri oluşturabilme yetkisi.' },
            { key: 'PRODUCTION_EDIT', name: 'Üretim Emrini Güncelle', module: 'production', action: 'update', description: 'Üretim aşamasını, durumunu (planlandı, üretimde, durdu) ve fire oranlarını kaydetme.' },
            { key: 'PRODUCTION_DELETE', name: 'Üretim Emri İptal/Sil', module: 'production', action: 'delete', description: 'Başlamamış üretim emirlerini iptal edip silebilme izni.' },
            { key: 'PRODUCTION_MANAGE_BOM', name: 'Ürün Reçetelerini Yönet', module: 'production', action: 'manage', description: 'Ürünlerin reçetelerini (BOM - ham madde bileşenleri ve adetleri) ekleme/düzenleme/silme.' },

            // 👥 Roller ve Yetkiler Modülü (roles)
            { key: 'ROLES_PAGE', name: 'Roller Sayfa Erişimi', module: 'roles', action: 'read', description: 'Sol menüde Rol ve İzin Yönetimi sayfasına girebilme izni.' },
            { key: 'ROLES_VIEW_ALL', name: 'Tüm Rol Şablonlarını Gör', module: 'roles', action: 'read', description: 'Sistemdeki tüm rolleri (Admin, Depo, Satış vb.) ve bunlara bağlı izin matrislerini inceleme.' },
            { key: 'ROLES_CREATE', name: 'Yeni Rol Oluştur', module: 'roles', action: 'create', description: 'Sisteme yeni bir yetki grubu/rol profili tanımlayabilme.' },
            { key: 'ROLES_EDIT', name: 'Rol Yetkilerini Düzenle', module: 'roles', action: 'update', description: 'Mevcut rollerin içerdiği izin anahtarlarını ekleyip çıkarabilme (Yetki Matrisini Değiştirme).' },
            { key: 'ROLES_DELETE', name: 'Rol Sil', module: 'roles', action: 'delete', description: 'Kullanımda olmayan yetki şablonlarını/rolleri sistemden silebilme.' },
            { key: 'ROLES_ASSIGN', name: 'Kullanıcıya Rol Ata', module: 'roles', action: 'manage', description: 'Bir personele sistemdeki hazır rollerden birini atayabilme izni.' },

            // 👤 Kullanıcı Yönetimi (users)
            { key: 'USERS_PAGE', name: 'Kullanıcı Sayfa Erişimi', module: 'users', action: 'read', description: 'Sol menüde Kullanıcılar & Personeller listesine erişebilme.' },
            { key: 'USERS_VIEW_DEPT', name: 'Departman Kullanıcılarını Gör', module: 'users', action: 'read', description: 'Kendi departmanındaki personellerin iletişim ve temel çalışma bilgilerini görme.' },
            { key: 'USERS_VIEW_ALL', name: 'Tüm Kullanıcıları Gör', module: 'users', action: 'read', description: 'Şirket genelindeki tüm personelleri, departmanlarını ve durumlarını listeleme.' },
            { key: 'USERS_CREATE', name: 'Yeni Personel Ekle', module: 'users', action: 'create', description: 'Sisteme yeni kullanıcı hesabı ve personel kartı tanımlama.' },
            { key: 'USERS_EDIT', name: 'Kullanıcı Bilgisi Düzenle', module: 'users', action: 'update', description: 'Personelin genel profil ve iletişim bilgilerini güncelleyebilme.' },
            { key: 'USERS_RESET_PASSWORD', name: 'Şifre Sıfırla', module: 'users', action: 'update', description: 'Kullanıcıların giriş şifrelerini değiştirme ve sıfırlama yetkisi.' },
            { key: 'USERS_CHANGE_DEPARTMENT', name: 'Departman Değiştir', module: 'users', action: 'update', description: 'Personelin bağlı olduğu departmanı (satış, depo, montaj vb.) değiştirme yetkisi.' },
            { key: 'USERS_LOCK_ACCOUNT', name: 'Hesabı Kilitle / Engelle', module: 'users', action: 'update', description: 'Kullanıcı hesaplarını askıya alma, dondurma veya kilit açma yetkisi.' },
            { key: 'USERS_DELETE', name: 'Kullanıcı Sil', module: 'users', action: 'delete', description: 'Kullanıcı hesabını sistemden tamamen silebilme izni.' },
            { key: 'USERS_OVERRIDE_PERM', name: 'Özel Yetki Ata (Override)', module: 'users', action: 'manage', description: 'Rolünden bağımsız olarak, bir kullanıcıya özel ek izin ekleme veya belirli bir izni yasaklama (Deny).' },

            // 🖥️ Sistem Ayarları Modülü (system)
            { key: 'SYSTEM_PAGE', name: 'Sistem Ayarları Sayfa Erişimi', module: 'system', action: 'read', description: 'Sol menüde Sistem Ayarları ve Genel Parametreler menüsünü görme.' },
            { key: 'SYSTEM_VIEW', name: 'Sistem Konfigürasyonunu Gör', module: 'system', action: 'read', description: 'Şirket parametrelerini, API anahtarlarını ve genel entegrasyon ayarlarını inceleme.' },
            { key: 'SYSTEM_EDIT_CURRENCY', name: 'Döviz / Kur Yönetimi', module: 'system', action: 'update', description: 'Döviz birimi ekleme, günlük/manuel döviz kurlarını güncelleme yetkisi.' },
            { key: 'SYSTEM_EDIT_INFO', name: 'Şirket Bilgilerini Düzenle', module: 'system', action: 'update', description: 'Şirket resmi unvanı, fatura bilgileri ve logo gibi kurumsal ayarları değiştirme.' },
            { key: 'SYSTEM_MANAGE_BACKUP', name: 'Veritabanı Yedekleme', module: 'system', action: 'manage', description: 'Sistem yedeği (SQL Dump) alma, yedek indirme veya yedekten geri yükleme işlemleri.' },
            { key: 'SYSTEM_VIEW_LOGS', name: 'Sistem Loglarını Gör (Audit)', module: 'system', action: 'read', description: 'Hangi kullanıcının hangi tarihte hangi işlemi yaptığını gösteren tüm sistem işlem loglarını (Audit Log) izleme.' }
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
        // Geri alma işlemine bu aşamada gerek duyulmamaktadır.
    }
}
