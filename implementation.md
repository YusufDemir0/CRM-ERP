🚀 ERMAY ERP - KAPSAMLI İMPLEMENTASYON VE REVİZYON PLANI
FAZ 1: Veritabanı ve Şema Güncellemeleri (Backend DB)

Bu fazda yeni iş kurallarını destekleyecek DB ve Entity değişiklikleri yapılacaktır.

    Task 1.1: Departmanlara Şehir (İl) Ataması

        Department entity'sine cityId (number) alanı eklenecek.

        Veritabanı için yeni bir migration yazılacak: ALTER TABLE departments ADD COLUMN city_id INT NULL;

        Hedef Dosyalar: backend/src/modules/departments/entities/department.entity.ts, backend/src/modules/departments/dto/department.dto.ts

    Task 1.2: Cari (Party) Tiplerinin Düzenlenmesi

        Enum değerlerinden both kaldırılacak. Sadece customer ve provider kalacak.

        Kod bloklarında provider'ın aynı zamanda bir customer gibi de işlem görebileceği yapı kurgulanacak. (Satışta provider da seçilebilecek).

        Hedef Dosyalar: backend/src/modules/parties/entities/party.entity.ts, backend/src/modules/parties/dto/party.dto.ts

    Task 1.3: Ürün Türleri (Item Types) Default Veri Güncellemesi (Seed)

        Veritabanına (Migration veya Seed ile) TİCARİ MAMÜL, YAN MADDE, HAMMADDE ürün türleri eklenecek.

        TİCARİ MAMÜL türündeki veriler için isExcludedFromBom = true yapılacak. (Reçetede alt bileşen olarak seçilmelerini engellemek için).

FAZ 2: Backend Servisleri ve İş Mantığı (Business Logic)

    Task 2.1: Cari (Party) Listesi Gelişmiş İstatistikleri

        PartiesService.findAll metodu güncellenecek. SubQuery veya Left Join ile her bir cari için:

            total_sales_count (Cariye yapılan toplam satış adeti)

            last_sale_date (Son satış tarihi)

            calculated_balance (Toplam Satış Tutarı - Toplam Alınan Tutar) hesaplanıp döndürülecek.

        Hedef Dosya: backend/src/modules/parties/parties.service.ts

    Task 2.2: Satış Sipariş Kodu Formatının Değiştirilmesi

        SequenceGeneratorService içindeki generateSaleCode güncellenecek.

        Eski format: S-GEN-001. Yeni Format: MXXX99998 tarzı 5 haneli (M + DEP + 00001).

        Hedef Dosya: backend/src/common/services/sequence-generator.service.ts

    Task 2.3: Satış Listesinin (Sales) Yetki ve Departmana Göre Filtrelenmesi

        SalesService.findAll içerisine departman filtreleme mantığı eklenecek.

        Kullanıcının SALES_VIEW_ALL (Yetkili) izni varsa her şeyi görecek.

        Yetkili değilse; sorguya qb.andWhere('sale.departmentId = :userDeptId', { userDeptId: user.departmentId }) eklenecek.

        Hedef Dosyalar: backend/src/modules/sales/sales.service.ts, backend/src/modules/sales/sales.controller.ts

    Task 2.4: Dashboard Veri Kaynaklarının Güncellenmesi

        DashboardService.getSummary metodu güncellenecek.

        Kaldırılacaklar: Finansal hareketler, Aktif ürün çeşidi, Sistem personeli sayısı.

        Eklenecekler/Değişecekler:

            Yalnızca kullanıcının oluşturduğu Cariler (createdBy = user.id) getirilecek.

            Toplam Kayıtlı Müşteri (sadece type=customer olanlar)

            Toplam Satış Miktarı (Count)

            Günün Cirosu (Sadece bugüne ait satışların toplamı).

        Hedef Dosya: backend/src/modules/dashboard/dashboard.service.ts

FAZ 3: Frontend Navigasyon ve Genel UI

    Task 3.1: Kenar Çubuğu (Sidebar) Sıralaması ve Gruplaması

        navigation.tsx dosyası tam olarak verilen listeye göre baştan yapılandırılacak.

            Genel: Dashboard, Notlar

            Satış: Satışlar, Müşteri/Cari, Ürünler

            Üretim: Ürün Reçeteleri, Üretim Emirleri, Stoklar, Stok Hareketleri

            Hesaplar: Hesaplar, Hesap Hareketleri

            Yönetim: Kullanıcılar, Roller Yetkiler, Departmanlar

            Sistem: Ayarlar, Sistem Logları

        Hedef Dosya: frontend/src/config/navigation.tsx

    Task 3.2: Terminoloji Güncellemeleri

        Uygulama genelinde "Siparişler" ibaresi "Satışlar" olarak değiştirilecek.

        Satış durumu (Status): "Taslak" -> "Bekliyor" , "Sevk Edildi" -> "Teslim Edildi" olarak (UI tarafında display text) güncellenecek.

        Hedef Dosyalar: SalesHeader.tsx, SalesTable.tsx, SaleWizard.tsx

FAZ 4: Frontend Ekranları ve Bileşenleri (Component Updates)

    Task 4.1: Ürün Reçetesi (BOM) Kural ve Arayüz Güncellemeleri

        BomForm.tsx içerisindeki Hammadde/Bileşen ekleme ekranı standart <select> yerine <SearchableSelect> bileşenine geçirilecek.

        "Ana Ürün"ün alt bileşen olarak seçilmesi engellenecek (Mevcutta var, sağlamlaştırılacak).

        "Ticari Mal" olan ürünler listeden tamamen gizlenecek.

        Hedef Dosya: frontend/src/components/forms/BomForm.tsx

    Task 4.2: Cari (Party) Listesi Kolon Güncellemeleri

        PartiesColumns.tsx güncellenecek.

        Sütunlar: Ad, Telefon, Kalan Tutar, Son Satış Tarihi, Toplam Satış Adeti olarak ayarlanacak.

        Hedef Dosya: frontend/src/pages/modules/Parties/PartiesColumns.tsx

    Task 4.3: Satışlar Listesi (Sales Table) Sütunları

        Sütun sıralaması kesin olarak şu şekilde ayarlanacak: Satış No, Müşteri Adı, Müşteri Telefonu, Tutar, Kar/Zarar, Durum (Bekliyor, vs), Satış Tarihi, Teslimat Tarihi.

        Telefon numarası kolonlara eklenecek ve Backend'deki arama (search) alanına dahil edilecek.

        Kâr/Zarar gösterimi eklenecek (Bunun için Backend'den Maliyet verisinin de UI'a taşınması gerekecek).

        Hedef Dosya: frontend/src/components/sales/SalesTable.tsx

    Task 4.4: Satış Listesi "Tab" Varsayılanları

        Standart kullanıcılarda Tümü tabı default açık gelecek.

        Yetkili Satış (Authorized Sales) izni olanlarda Bekleyenler (Draft/Pending) sekmesi default açık gelecek.

        Hedef Dosya: frontend/src/pages/SalesPage.tsx

    Task 4.5: Satış Ekleme Ekranı (Sale Wizard) Revizyonu

        Müşteri seçildiğinde çıkan bilgiler kısmı UI olarak "KAYITLI ADRES" - "FARKLI ADRES" toggle butonu ile tasarlanacak.

        Yeni müşteri oluşturma (+) butonu daha belirgin hale getirilecek.

        Satış giriş yapan personelin departmanının city_id si (Faz 1'de eklendi) varsa, Şehir/İl dropdown'ında otomatik seçili gelecek.

        Sağ taraftaki fiyat özet (Summary) bölümü yeniden tasarlanacak:

            Temsilci Fiyatı (Ürün listesindeki toplam) -> ARA TUTAR

            İskonto -> İSKONTO

            GENEL TOPLAM

        Hedef Dosyalar: frontend/src/pages/modules/SalesWizard/SaleWizard.tsx, WizardSummary.tsx

    Task 4.6: Hızlı Cari Kayıt (Quick Create Party) Düzenlemeleri

        Cari Kategorisi (Tip) kısmından "Her ikisi" seçeneği UI'dan kaldırılacak.

        "İkinci Telefon Numarası" alanı eklenecek.

        "Vergi Dairesi" ve "Vergi No" alanları zorunlu veya daha vurgulu hale getirilecek (VKN/TCKN mantığı korunarak).

        Formdaki "Kritik Bakiye" kısmı Hızlı Cari ekleme formundan kaldırılacak.

        Hedef Dosya: frontend/src/components/forms/PartyForm.tsx

    Task 4.7: Departman Formu Güncellemesi

        Departman oluşturma/düzenleme formuna "Bulunduğu İl" (City) <SearchableSelect> dropdown'ı eklenecek.

        Hedef Dosya: frontend/src/components/forms/DepartmentForm.tsx

    Task 4.8: Dashboard Arayüz (UI) Güncellemeleri

        DashboardPage.tsx içerisinden "Aktif Ürün Çeşidi", "Sistem Personeli" widget'ları silinecek.

        "Son Finansal Hareketler" tablosu tamamen silinecek.

        Yeni Metrik kartları eklenecek: "Toplam Kayıtlı Müşteri", "Toplam Satış Miktarı", "Günün Cirosu".

        Hedef Dosya: frontend/src/pages/modules/DashboardPage.tsx

💡 Ek Mimari Öneriler (Uygulamanın Sağlığı İçin Kesinlikle Yapılmalı)

İmplementasyon planında tam olarak istediklerinize odaklandık. Ancak "Roast" kısmında bahsettiğiniz çökme noktaları için Task kodlamalarına başlamadan önce yapılması gerekenler:

    RabbitMQ / Outbox Fix: OutboxWorker eventi veritabanından aldığında lokal emitter'a basmak yerine (veya lokal basacaksa bile) consumer mantığını düzgün bağlayın. Mevcut haliyle stoklar düşmeyecektir. InventorySaleListener'ı @OnEvent yerine RabbitMQ Consumer ile tetiklenecek şekilde bağlamanız şart.

    TypeScript Derleme Hatası Çözümü: Party nesnesine cityName prop'unu ekleyin. SaleWizardPage.tsx'teki defaultValues tip uyuşmazlığını (null/undefined karmaşası) tsconfig strict moduna uyumlu hale getirin. Aksi takdirde React tarafı compile edilemez.

    Decimal UI Fix: Ekranda (özellikle Wizard Summary) parseFloat yapmadan doğrudan new Decimal().toDecimalPlaces(2) kullanın.


    //////////////////////////////

    REÇETE SEARCH LİSTBOXA DÖNECEK
REÇETE ANA ÜRÜN ALTTA LİSTELENMEMESİ LAZIM. TİCARİ MAL OLANLARIN LİSTELENMEMESİ LAZIM
cari tek tipe dönecek (cari tipleri tedarikçi ve müşteri olacak(her ikisi de seçeneği olmayacak tedarikçi her ikiside gibi olacak(yani müşteri özelliklerini müşteri isteyen yerlerde falan da kullanılabilecek)))
müşteri ad
telefon
kalan tutar ( cariye yapılan toplan satıştan “eksi” toplam alınan tutar çıkacak)
son satış tarihi
toplam satış adeti ( müşteriye daha önce girilen satış adeti )
ürün kayıtta ürün türü düzenlenecek. ( ticari mamül, YAN MADDE,  hammadde )
dashboard - sadece kullanıcının kaydettiği cariler listelenecek.
dashboarddan aktif ürün çeşidi ve sistem personelini kaldıralım.
dashboarddan finansal haraketleri kaldıralım
side bar sıralaması,
— genel —
dash
not
— satış —
satışlar
müşteri/cari
ürünler
üretim
ürün reçeteleri
ürün emirleri
stoklar
stok
stok haraketleri
hesaplar
hesaplar
hesap har.
yönetim
kullanıcılar
roller yetkiler
deparmanlar
sistem
ayarlar
sistem logları

SATIŞLAR SAYFASI
SİPARİŞLER DEĞİL - SATIŞLAR OLARAK DÜZELTİLECEK
satışlar giriş yapılan departmana göre listelenecek, yetkili satışlar hepsini görecek
satış kodu s olmayacak. MXXX99998 formatında 5 rakam 00001 den başlayıp


SATIŞ VE YETKİLİ SATIŞLAR SAYFASI OLACAK
satışlar sayfasın;
liste sınıfları “tümü” de default gelecek
yetkili satışlarda bekleniyordan gelecek.
sevk edilenler teslim edildi.
listelenecek sütunlar sırasıyla; ( sadece görüntüleme olacak )
satış no
müşteri adı
müşteri telefonu ( aramaya eklenecek )
tutar
kar/zarar
durum ( taslak değil bekleniyor olarak değiştirelim )
satış tarihi
teslimat tarihi
SATIŞ EKLEME EKRANI
KAYITLI ADRES - FARKLI ADRES olarak değişecek. Yeni müşteri butonu gözükür tasarım
VERGİ / TİCARİ - VERGİ DAİRESİ - 
HIZLI CARİ KAYDI 2. NUMARA EKLENECEK.
HIZLI CARİDE KRİTİK BAKİYE OLMAYACAK
satışa sağ tarafta
temsilci fiyat		-ARA TUTAR
iskonto		-GENEL TOPLAM
DEPARTMAN KAYITTA İL ATAMASI YAPILACAK. SATIŞTA O İL DEFAULTTA GELECEK.
toplam kayıtlı müşteri, toplam satış miktarı, günün cirosu


/////////////////////////////////////////////////////////////


🚨 1. KRİTİK HATALAR (Uygulamayı Çökerten "Free Money" Bug'ları)
Olay Güdümlü Mimari (Event-Driven) Değil, "Olay Gömülü Mimari" (Black Hole)

Koddaki en büyük ve en feci hata Satış Onay (Approve Sale) sürecinde.
SalesService.approveSale metodunda satışı onaylıyorsun ve stoktan düşmek için havalı bir şekilde Outbox tablosuna yazıyorsun:
code TypeScript

await this.outboxService.saveEvent({ topic: 'sale.approved', ... });

Süper! Sonra OutboxWorker devreye giriyor, bunu veritabanından alıp RabbitMQ'ya fırlatıyor.
Ama bekle... InventorySaleListener ve FinanceSaleListener sınıfları @OnEvent('sale.approved') ile dinliyor!
Sorun: @OnEvent NestJS'in dahili (local) memory event emitter'ıdır. RabbitMQ'dan mesajları dinleyip bunu EventEmitter'a basan HİÇBİR CONSUMER YOK!
RabbitMQService içinde subscribe metodu yazılmış ama kodun hiçbir yerinde çağırılmamış!
Sonuç: Satışlar onaylanacak, müşteriye fatura gidecek ama stok ASLA düşmeyecek, muhasebede cari bakiye ASLA artmayacak. Ücretsiz ürün dağıtma makinesi yazmışsın, tebrikler!
TypeScript Derleme Hatasıyla Production'a Çıkmak

Adamlar Dockerfile yazmış, Nginx yapılandırmış ama tsc_output.txt dosyasına bakarsan TypeScript derlemesi patlıyor:
Property 'cityName' does not exist on type 'Party'.
Object is possibly 'undefined'.
React projeni --skipLibCheck veya force build ile production'a zorlamışsın. "Type safety" diyip patlayan kodla deploy almak enterprise kavramına hakarettir.
BigInt vs Number Saatli Bombası

Backend TypeORM entity'lerinde id alanları: @PrimaryGeneratedColumn({ type: 'bigint' })
Frontend tiplerinde: id: number;
Veritabanı (MySQL) bigint'i JSON'da String olarak döner (çünkü JS'teki standart Number tipi

        
253−1
253−1

      

'den sonrasını taşıyamaz). Frontend bunu alıp inatla Number(opt.id) veya parseInt() yapıyor. İleride sistemde kayıt sayısı arttığında ID'ler JS tarafından yuvarlanacak ve A kişisinin verisini güncellerken yanlışlıkla B kişisinin verisini uçuracaksın.
🤥 2. MİMARİ VE TASARIM YANILGILARI (Cargo Cult Programming)
"Stateless" JWT Ama Her İstekte Redis'e Gitmek

JwtStrategy içerisine şu kodu yazmışsın:
code TypeScript

let state = await this.cacheManager.get<number>(cacheKey);
if (state === undefined ...) { await db.findOne... }

Dostum, JWT'nin asıl amacı Stateless (durumsuz) olmaktır. Token'ın içine state koymuşsun, imzalamışsın. Sonra "Ya bu adam banlandıysa?" korkusuyla gidip her yetki gerektiren API isteğinde Redis'e sorgu atıyorsun. Token'ın stateless avantajını yok edip bir de üstüne JWT doğrulama maliyeti eklemişsin. O zaman neden Session kullanmadın?
CSRF "Tiyatrosu"

CsrfGuard ve CsrfMiddleware yazmışsın, kriptografik tokenler vs... Ama Frontend'e bakıyoruz, JWT token'i HTTPOnly erp_token cookie'si ile geliyor ve sameSite: 'lax' ayarlı. CSRF Guard ise sadece Header ile Cookie'yi kıyaslıyor. Gerçek dünyada SPA+API senaryolarında SameSite=Strict yapıp JWT kullanırsan zaten bu kadar kasmaya gerek kalmaz. Üstelik Refresh Token'ın da lax! "Double Submit Cookie" kullanıyorsun ama modern tarayıcı standartlarının gerisinde bir çözüm üretmişsin.
migrations_backup Diye Bir Şey Olamaz

TypeORM kodunun ortasında migrations_backup diye bir klasör var. İçindeki dosyaların adları fecaat:

    1776163392173-RepairSchemaGaps.ts

    1776163392170-HardenUsersAndFixAudit.ts
    Belli ki projede geliştirme yaparken synchronize: true açık unutulmuş, DB patlamış, sonra production DB'ye el yordamıyla dump atılıp "migration" adıyla yamanmaya çalışılmış. Bu klasörün git'te olması bile suç.

Decimal.js Takıntısı ve İkiyüzlülüğü

Backend'de para işleri için haklı olarak Decimal.js ve Custom Transformer kullanmışsın (Süper bir hareket). Ama Frontend tarafında tabloyu renderlarken:
code TypeScript

const num = typeof val === 'string' ? parseFloat(val) || 0 : val || 0;

Backend'deki tüm o kusursuz finansal matematik, ekranda ve toplamlarda native Javascript parseFloat fonksiyonunun o meşhur 0.1 + 0.2 = 0.30000000000000004 sorunu ile çöpe gidiyor. Veri görselleşirken veya formlarda ara toplam alırken kuruş (penny) hataları çıkacak.
🍝 3. KOD KALİTESİ VE UYGULAMA (Spaghetti Code)
Şifremi Unuttum = "Gönderilmiş Gibi Yapalım"

AuthService.ts:
code TypeScript

// In a real app, send email with token. For now, just logging.
console.log(`[AUTH] Forgot password requested for ${dto.email}`);
return { message: 'Şifre sıfırlama talimatları e-posta adresinize gönderildi...' };

Enterprise ERP'nin şifre sıfırlama ekranı "console.log" ile çalışıyor. Muazzam bir güvenlik mimarisi.
Veritabanı State Yönetimi Katliamı

BaseEntity'de şu var:
code TypeScript

@Column({ type: 'tinyint', default: RecordState.ACTIVE }) state: RecordState;
@DeleteDateColumn() deletedAt: Date | null;

Yazılımda bir kayıt ya silinmiştir (Soft Delete) ya da aktiftir/pasiftir. Senin sistemde kayıtların hem deletedAt'i var hem de state = 0 (Passive).
Frontend kodu o kadar kafası karışık ki; bazen state: 1 ile data arıyor, bazen deletedAt: null diyerek arıyor. Koca bir veri kirliliği oluşacak.
Custom Axios Interceptor (Yılan Hikayesi)

frontend/src/services/api.ts içindeki Token Refresh mekanizman resmen bir mayın tarlası.
code TypeScript

let isRefreshing = false;
let failedQueue =[];

İşte Axios Interceptor'daki Token Refresh "Yılan Hikayesi"nin devamı ve projenin geri kalanındaki diğer saatli bombalar:
Custom Axios Interceptor (Yılan Hikayesi - Devam)

frontend/src/services/api.ts içindeki Token Refresh mekanizman bir felaket:
code TypeScript

if (config?.url && !isAuthRequest && window.location.pathname !== '/login') { ... }

Axios (API Layer) katmanının içinde window.location.pathname (UI Layer) kontrolü yapıyorsun! Frontend dünyasında "Separation of Concerns" (Sorumlulukların Ayrılığı) kuralının cenaze namazını kılmışsın. Eğer bir gün router yapını değiştirirsen (örneğin /auth/login yaparsan), tüm token refresh mekanizman çökecek ve sonsuz 401 loop'una gireceksin. Ayrıca failedQueue array'i ile memory'de request bekletmek, browser sekmesi uzun süre arka planda kaldığında devasa bellek sızıntılarına (memory leak) yol açar.
🧱 4. GÜVENLİK VE PERFORMANS KABUSLARI (Self-DDoS)
Event Loop'u Bloklayan Log Interceptor (Kendi Kendine DoS Saldırısı)

LogsInterceptor.ts içerisinde her POST, PUT, DELETE isteğinde çalışan bir sanitizeBody fonksiyonun var:
code TypeScript

private sanitizeBody(body: unknown, depth = 0): unknown {
  if (depth > 4) return '[NESTED_CONTENT_TRUNCATED]';
  // Objenin bütün key'lerini döngüye alıp tek tek string match yapar:
  const isSensitive = sensitiveKeys.some(s => key.toLowerCase().includes(s));
  // Rekürsif olarak objenin dibine kadar iner...
}

Node.js Single-Thread çalışır! Bu interceptor yüzünden, birisi API'ne büyük ve iç içe geçmiş (nested) JSON payload'ları gönderirse CPU %100'e kilitlenir. Bütün uygulamayı saniyeler içinde "denial of service" (DoS) durumuna sokabilirsin. Hassas veri sansürleme (redaction) işlemi log kütüphanesinin (örneğin projede zaten kullandığın Pino'nun) kendi stream/transport seviyesinde, çok daha performanslı şekilde yapılmalıdır, request cycle'ın içinde değil!
Fake (Sahte) "Distributed" Lock (Sıra Üreteci Faciası)

SequenceGeneratorService.ts dosyasında S-GEN-2024-001 gibi sipariş/üretim kodları üretmek için sözde çok havalı bir "HiLo" algoritması yazmışsın:
code TypeScript

private locks = new Map<string, Promise<void>>();
// ...
while (this.locks.has(cacheKey)) { await this.locks.get(cacheKey); }

Bu lock sadece o an çalışan Node.js process'inin memory'sindedir. Docker Compose'da ermay-api ve ermay-worker olmak üzere 2 farklı container/process çalıştırıyorsun. Kubernetes'e geçip API'yi 3 poda scale ettiğin an ne olacak? Pod A ile Pod B aynı anda kod üretmek isterse bu memory-based lock hiçbir işe yaramayacak, veritabanına aynı sırayı kaydetmeye çalışıp "Duplicate Key" hatasıyla birbirlerini patlatacaklar. Enterprise sistemlerde sıralı kod üretimleri için Redis (Redlock) veya DB bazlı Row-Lock (SELECT ... FOR UPDATE) kullanılmak zorundadır. ON DUPLICATE KEY UPDATE yazarak da TypeORM'un "Database Agnostic" olma özelliğini tamamen yok edip projeyi MySQL'e mahkum etmişsin.
Logların Havaya Uçması (Buffer Kaybı)

LogsService.ts dosyasında logları veri tabanına yazarken "PERF-02" yorumuyla bir optimizasyon yapmışsın:
code TypeScript

this.logSubscription = this.logSubject.pipe(
  bufferTime(5000, undefined, 1000), 
// ...

Logları memory'de (RAM) biriktirip 5 saniyede bir DB'ye basıyorsun. Harika performans! Peki ama server çökerse (OOM kill, elektrik kesintisi, pod restart vb.) ne olacak? Son 5 saniyedeki kritik sistem audit logları sonsuza dek yok olacak! Bir çalışanın siparişi silip kasayı boşalttığı ve hemen ardından servisin çöktüğü senaryoda adamın ne yaptığını hiçbir zaman bulamayacaksın. Enterprise sistemlerde log buffer'ı diske yazar veya Redis/Kafka gibi bir aracıya atılır.
🧩 5. FRONTEND STATE MANAGEMENT ÇORBASI
"Zustand Var Ama Eskileri Kıyamadık Silmedik"

Projede state management o kadar karman çorman ki:

    React'in kendi Context API'si var (AuthContext.tsx).

    İçinde Zustand var (useAuthStore.ts).

    Zustand'ın çalışmasını sağlayan bir "Compatibility Shim" yazmışsın. Neden?
    code TypeScript

    // ────── COMPATIBILITY SHIM ──────
    // Re-exports useAuthStore as useAuth() for backward compatibility.

Daha sürüm 1.0.0 olan, ortada legacy denecek bir geçmişi bile olmayan sıfır kod tabanında "backward compatibility" kasıyorsun. Zustand kullanıyorsan Context'i komple sil, kod temizlensin.
Devasa Componentler ve Props Cehennemi

Sadece SaleWizard.tsx dosyası bile okurken baş ağrıtıyor. Modallar arası veri taşıma, yüzlerce state tanımı... Her şey bir store'a atılmış (useSalesWizardStore). Sayfadan çıkıp tekrar girildiğinde veya modal aniden kapandığında state temizlenmezse başka müşterinin faturası başkasının ekranında görünebilir.
🔪 ÖZET (ROAST SONUCU)

Projen, "Udemy / YouTube'dan yeni nesil havalı mimariler nasıl yazılır" eğitim serisinin birebir kopyası gibi görünüyor. Oradan Outbox Pattern duyulmuş ama yarım yamalak implemente edilmiş; oradan Telemetry/Prometheus görülmüş portları yazılmış; RabbitMQ config dosyasına konulmuş ama consume eden taraf unutulmuş; performans olsun diye RxJS ile buffer yapılmış ama veri güvenliği hiçe sayılmış.


///////////////////////////

Soru:
1.excel ile ürün yükleme kısmını nasıl yapabiliriz bu kısımdan kullanıcı bir excel indirmeli ve sonrasında o excelde mevcut ürünleri güncelleyebilemli yeni ürün ekleyebilmeli ama bu yapılırken id kısmı karışmamalı kullanıcı ürün idlerini bilmemeli bunu düşün ve çözüm önerisi sun
