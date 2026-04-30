# 📜 ERMAY ERP - Geliştirme Kuralları (Development Rules & Guidelines)

Bu dosya, Ermay ERP projesinin geliştirme sürecinde kod kalitesini korumak, eski mimari hatalara (anti-pattern) geri dönmemek ve enterprise (kurumsal) standartlarda bir ürün ortaya koymak için uyulması zorunlu kuralları içerir.

## 1. 🛡️ TypeScript ve Tip Güvenliği (Type Safety)
*   **KESİNLİKLE `any` KULLANILMAYACAK:** Projede `any` tipi kullanımı yasaktır. Verinin tipi bilinmiyorsa `unknown` kullanılacak ve "Type Guard" (tip koruyucu) veya validasyon kütüphaneleri (Zod, class-validator) ile doğrulanacaktır.
*   **ID Yönetimi (BigInt vs String):** Veritabanından `bigint` olarak dönen tüm ID'ler, Frontend tarafında **kesinlikle matematiksel işleme sokulmayacak**, `parseInt()` veya `Number()` ile dönüştürülmeyecektir. Tüm ID'ler arayüzlerde (Interface/DTO) `string` olarak tanımlanacak ve taşınacaktır.
*   **Sıkı Derleme (Strict Mode):** TypeScript derleyicisinin uyardığı "Object is possibly undefined" gibi hatalar `--skipLibCheck` veya zorlama (force) ile geçiştirilmeyecek, tipler (Örn: `Party` nesnesine eksik propların eklenmesi) kod içinde kesin olarak çözülecektir.

## 2. 🏗️ Mimari Katmanlar ve Sorumlulukların Ayrılığı (Separation of Concerns)
*   **API Katmanında UI Kontrolü Yapılamaz:** Axios Interceptor veya backend servisleri içinde `window.location.pathname` gibi arayüz (UI) katmanına ait yönlendirme ve mantık kontrolleri yapılamaz. API katmanı sadece veri transferi ve yetki (HTTP statüleri) ile ilgilenir.
*   **Büyük Bileşenler (Component) Parçalanacak:** Yüzlerce satırlık, içinde sayısız state barındıran (örn: `SaleWizard`) devasa React bileşenleri yazılmayacaktır. Mantık katmanı Custom Hook'lara (`useSaleWizardLogic`), arayüz ise küçük alt bileşenlere (Sub-components) ayrılacaktır.

## 3. 💸 Finansal ve Matematiksel İşlemler
*   **`parseFloat` Yasaktır:** JavaScript'in native ondalıklı sayı hesaplama problemleri (`0.1 + 0.2 = 0.30000000000000004`) nedeniyle UI tarafında fatura, ara toplam ve vergi hesaplamalarında asla native `parseFloat` kullanılmayacaktır.
*   **Sadece Decimal.js:** Hem Backend hem de Frontend'de tüm parasal değerler ve stok miktarları `Decimal.js` (veya benzeri bir kütüphane) ile hesaplanacak ve veritabanına öyle kaydedilecektir.

## 4. 🔄 State (Durum) Yönetimi (Frontend)
*   **Tek Bir State Yöneticisi:** Aynı işi yapan birden fazla state kütüphanesi kullanılmayacaktır. Authentication ve global state işlemleri tamamen **Zustand** ile yönetilecek, projede geriye dönük uyumluluk (backward compatibility shim) adına bırakılan eski React Context API yapıları silinecektir.

## 5. 🚀 Olay Güdümlü Mimari ve Asenkron İşlemler (Backend)
*   **Yerel Event'ler Kritik İşlemlerde Kullanılamaz:** Stok düşme, finansal bakiye güncelleme gibi modüller arası (cross-domain) kritik işlemler NestJS `@OnEvent` (local memory) ile **yapılamaz**.
*   **RabbitMQ Zorunluluğu:** Bu tür işlemler RabbitMQ üzerinden (Producer -> Consumer mimarisiyle) veya Transactional Outbox pattern kurallarına birebir uyularak yapılacaktır.

## 6. 🔐 Güvenlik, Performans ve Dağıtık Sistemler (Concurrency)
*   **Memory-Based Kilit (Lock) Kullanımı Yasaktır:** Fatura/Sipariş numarası üretimi (`S-GEN-001` vb.) gibi sıralı işlemlerde `Map` veya `Set` gibi sadece o anki Node.js sürecinde (memory) yaşayan kilitler kullanılamaz. Çoklu pod/sunucu senaryoları düşünülerek veritabanı satır kilidi (`SELECT ... FOR UPDATE`) veya Redis bazlı kilitler kullanılacaktır.
*   **Self-DDoS Engelleme:** API'ye gelen payload'ları sansürlemek/loglamak için yazılan Interceptor'larda CPU'yu kilitliycecek sınırsız döngülü (recursive) veri taraması (sanitize) algoritması yazılmayacaktır.
*   **Log Kaybı Önlemi:** Kritik denetim (audit) logları sistemde RAM üzerinde uzun süreli (örn: 5 saniye buffer) bekletilmeyecek; crash (çökme) anında veri kaybı olmaması için anında (veya asenkron disk yazımı ile) kaydedilecektir.

## 7. 🗄️ Veritabanı ve Veri Bütünlüğü
*   **Manuel SQL Migration Dosyası Yasaktır:** TypeORM projelerinde `migrations_backup` gibi manuel/isimsiz SQL dosyaları barındırılamaz. Şema değişiklikleri her zaman CLI üzerinden `typeorm migration:generate` ile üretilip uygulanacaktır.
*   **Kayıt Durumu (State vs Soft Delete) Karmaşası:** Bir kaydın aktif/pasif/silinmiş durumu için aynı anda hem `state: 0/1` hem de `deletedAt: Date | null` mantığı karışık olarak kullanılamaz. Proje genelinde standart bir filtreleme mantığı oturtulacaktır.
