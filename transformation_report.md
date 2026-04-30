# 🚀 ERMAY ERP - Kapsamlı Dönüşüm ve Mimari İyileştirme Raporu

Bu rapor, sistemin stabilizasyonunu sağlamak, Roast kapsamında tespit edilen kritik hataları çözmek, Faz 1-4 arasındaki yeni özellikleri sisteme entegre etmek ve toplu ürün yükleme (Excel) işlemlerini güvenli bir şekilde tasarlamak için hazırlanmıştır.

## 1. Kritik Hataların Çözüm Stratejisi (Roast Düzeltmeleri)

Sistemi çökerten veya tutarsızlığa yol açan mimari sorunlar, yeni görevlere başlanmadan önce aşağıdaki stratejilerle çözülecektir:

### A. Olay Güdümlü Mimari (RabbitMQ & Outbox Fix)
*   **Sorun:** Stok düşme ve cari hareket işlemleri yerel (memory-based) olaylar (`@OnEvent`) üzerinden yapılıyor, RabbitMQ entegrasyonu kopuk.
*   **Çözüm:** `InventorySaleListener` ve `FinanceSaleListener` sınıflarındaki `@OnEvent` kullanımları kaldırılacaktır. Sistem gerçek anlamda mesaj kuyruğuna geçirilerek, bu servislerin RabbitMQ üzerindeki `sale.approved` topic'ini (RabbitMQ Consumer aracılığıyla) dinlemesi sağlanacaktır.

### B. TypeScript & Veri Tipleri Patlamaları
*   **Sorun:** `Party` nesnesindeki eksik proplar derlemeyi bozuyor. Veritabanındaki `bigint` ID'ler frontend tarafında native `Number` tipine dönüştürülüyor ve presizyon (precision) kaybı yaşatıyor.
*   **Çözüm:** Frontend'e gelen `bigint` ID'ler string olarak muhafaza edilecektir (Frontend entity arayüzlerinde `id: string` kullanılacak). Ayrıca `Party` nesnesine eksik proplar eklenecek, UI tarafındaki finansal hesaplamalar standart native `parseFloat` yerine, backend'deki gibi `decimal.js` yardımıyla yapılarak kuruş hatalarının önüne geçilecektir.

### C. Güvenlik, Performans ve Dağıtık Kilit (Lock) Sorunları
*   **Sorun:** Loglama Interceptor'u aşırı derin objelerde CPU kilitlenmesine yol açıyor. Satış sipariş sırası üretimi sadece memory bazlı (Map) kilitlerle yönetiliyor. Loglar bufferlanarak bekletiliyor, çökme anında log kaybı yaşanıyor.
*   **Çözüm:** Logları sansürleyen fonksiyon recursive (öz yinelemeli) taramadan çıkarılıp yüzeysel/hızlı bir tarayıcıya (örn. fast-redact) geçirilecek. Sıra (Sequence) üreteci memory bazlı yapıdan kurtarılıp, DB üzerinde `Row-Level Lock` (`SELECT ... FOR UPDATE`) veya spesifik sıra tabloları (Sequence Tables) kullanılarak güvenli hale getirilecek. Log buffer'ı kaldırılarak anlık veya dayanıklı (persistent) yazma yöntemi benimsenecek.

### D. Frontend Mimari ve State Çorbası
*   **Sorun:** İç içe geçmiş React Context ve Zustand kullanımları, Axios'un UI katmanına (pathname) bağımlı olması.
*   **Çözüm:** Eski Context yapısı tamamen temizlenerek kimlik doğrulama işlemleri tek başına Zustand store'unda yönetilecek. Axios Interceptor'dan UI tabanlı sorgular (`window.location.pathname`) silinecek. SaleWizard gibi devasa bileşenler (prop drilling'i önlemek adına) küçük mantıksal Hook'lara bölünecektir.

---

## 2. Faz 1-4 Uygulama Planı Özeti

*   **Faz 1 (Veritabanı):** `Department` entity'sine `city_id` eklenecek. Cari tipleri `customer` ve `provider` olarak revize edilip her iki rolün esnek kullanılabileceği kurgu yapılacak. Seed verilerine `TİCARİ MAMÜL`, `YAN MADDE`, `HAMMADDE` eklenecek (Ticari mamüller ürün ağacından dışlanacak).
*   **Faz 2 (Backend Servisleri):** Party servisine alt sorgularla toplam satış adeti, son satış tarihi ve bakiye hesaplamaları eklenecek. Satış kodu formatı `MXXX99998` olarak değişecek. Satış listesinde departmana ve yetkiye göre gelişmiş filtrelemeler aktifleştirilecek.
*   **Faz 3 (Navigasyon & Terminoloji):** "Siparişler" ibaresi "Satışlar" olarak değiştirilecek. Satış durumları (Taslak -> Bekliyor vb.) düzeltilecek. Menü sıralaması (Genel, Satış, Üretim, Hesaplar, Yönetim, Sistem) tamamen istenen listeye göre revize edilecek.
*   **Faz 4 (UI Geliştirmeleri):** Reçete seçici `SearchableSelect`'e geçirilecek ve filtreleme kuralları sağlanacak. Satış tablosu (SalesTable) kolonları ve Party (Cari) kolonları istenen şekilde dizilecek. `SaleWizard` ara yüzü "Kayıtlı Adres - Farklı Adres", finansal özet tasarımı (Ara Tutar, İskonto, Genel Toplam) dahil olmak üzere yeni düzenlemelerle modernleştirilecek. Dashboard gereksiz yüklerden arındırılıp (aktif personel vb.) günün cirosu gibi yeni metriklerle donatılacak.

---

## 3. Excel ile Ürün İçe/Dışa Aktarımı (Import/Export) Çözüm Önerisi

**Kullanıcının veritabanı ID'lerini (12, 1054 vb.) görmeden ve karıştırmadan işlem yapabilmesi için önerilen mimari çözüm:**

**Yöntem: İşletme Anahtarı (Business/Natural Key) - SKU/Ürün Kodu Bazlı Senkronizasyon**

Kullanıcılara sistemsel `id`'leri göstermek yerine, ticari olarak anlamı olan, eşsiz (unique) bir değer üzerinden işlem yapılmalıdır. Bu değer genellikle **"Ürün Kodu" (Item Code / SKU)** veya **Barkod** olur.

1.  **Dışa Aktarım (Export/Download):**
    *   Kullanıcı Excel şablonunu indirdiğinde sistemde kayıtlı ürünler listelenir.
    *   Sütunlar: `Ürün Kodu`, `Ürün Adı`, `Ürün Türü`, `Satış Fiyatı` vb. şeklinde olur.
    *   Burada hiçbir şekilde DB `id` kolonu yer almaz. Mevcut ürünlerin ürün kodları hücre koruması ile değiştirilemez (Read-Only) yapılabilir.
2.  **İçe Aktarım (Import/Upload) Süreci:**
    *   Kullanıcı Excel'i geri yüklediğinde Backend servisi her bir satırı okur.
    *   Satırdaki `Ürün Kodu` değerini veritabanında arar.
    *   **VARSA (Update):** Eğer o ürün kodu sistemde mevcutsa, eşleşen kaydın (ID'si sistem tarafından bulunur) diğer bilgilerini (Adı, Fiyatı) günceller.
    *   **YOKSA (Insert):** Eğer o ürün kodu sistemde yoksa, bunu tamamen yeni bir ürün kabul edip sisteme kaydeder.
3.  **Alternatif (Gizli Kolon/Şifreli Token):**
    *   Eğer kullanıcının "Ürün Kodu"nu da değiştirebilmesi gerekiyorsa; Excel dosyasına gözükmeyen (Hidden) ve kilitli bir sütun eklenir. Bu sütuna `id` açık metin olarak değil, güvenli bir **Şifreli Referans (HMAC/AES veya JWT Token)** olarak basılır. Backend dosyayı aldığında şifreyi çözer, hangi ID'ye ait olduğunu saptar. Ancak kullanım kolaylığı ve güvenlik açısından **"Ürün Kodu" (SKU)** bazlı 1. yöntem (Upsert mantığı) her zaman endüstri standartlarına daha uygundur.
