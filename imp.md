# Ermay CRM-ERP Revizyon Uygulama Planı (Güncellenmiş)

Bu plan, henüz uygulanması gereken revizyonları içerir. Tamamlanan maddeler plandan çıkarılmıştır.

---

## 📌 2. KİŞİSEL NOTLAR & KULLANICI ARAYÜZÜ

### 2.1 Kişisel Notlar Sayfası

* **Dosya:** `frontend/src/pages/modules/NotesPage.tsx`
* **Yapılacaklar:**

  * Sayfaya hızlı aksiyon almayı sağlayacak iki yeni işlem eklenecek:

    1. **Satış hatası bildir** (Form)
    2. **Kendime not ekle** (Hatırlatıcı ekleme formu)

### 2.2 Kullanıcılar Ekranı

* **Dosya:** `frontend/src/pages/modules/UsersPage.tsx`
* **Yapılacaklar:**

  * Liste görünümünün başındaki profil/kullanıcı logoları/avatarları kaldırılacak.
  * Kullanıcı oluşturma/düzenleme sırasında hiçbir yetki/rol seçilmemişse kırmızı renkli validasyon uyarısı verilecek.

---

## 📌 3. ROLLER VE YETKİLER

### 3.1 Satış Temsilcisi (Satış Yetkilisi) Rolü

* **Dosyalar:** Backend yetkilendirme servisleri ve `frontend/src/pages/modules/RolesPage.tsx`
* **Yapılacaklar:**

  * "Satış Yetkilisi" izinleri varsayılan olarak şu şekilde güncellenecek:

    * **Açık olanlar:** `SATIŞ ALTI SATIŞLAR`, `MÜŞTERİ ALTI MÜŞTERİLER`, `HESAPLAR ALTI HESAP`, `STOKLAR ALTI STOK`.
    * **Kapalı olanlar:** `YETKİLİ SATIŞLAR KAPALI`.
  * Admin harici yetkili kullanıcılar yalnızca kendi departmanlarının kaydettiği cari hesapları görebilecek.

### 3.2 Stok Sayfası Buton Kontrolleri

* **Dosya:** `frontend/src/pages/modules/StocksPage.tsx`
* **Yapılacaklar:**

  * Stok ekleme, düzenleme ve silme işlemleri yetki kontrolüne alınacak.

---

## 📌 4. SATIŞLAR VE YENİ SATIŞ SİHİRBAZI

### 4.1 Satış Sihirbazı Adım Hiyerarşisi (11 Adımlı Akış)

* **Dosyalar:** `frontend/src/pages/modules/SalesWizard/SaleWizard.tsx`
* **Yapılacaklar:**

  * 11 adımlı satış akışı uygulanacak:

    1. Müşteri Seçimi
    2. Bilgi Kontrolü
    3. Teslimat Tarihi
    4. Kapora & Temsilci
    5. Kasa Seçimi
    6. Referans Seçimi
    7. Açıklama
    8. Ürün Seçimi
    9. Anlaşılan Tutar
    10. Fatura Tipi
    11. Satış Onayı

### 4.2 Satış Sihirbazı Doğrulama ve UI Kuralları

* Kapora tutarı toplam satış tutarından büyük olamaz.
* Kapora ve teklif tutarı alanlarında otomatik metin seçme davranışı uygulanacak.
* Ürün seçim listesindeki `#` sütunu kaldırılacak.
* Grid sonuna **SEVK / DEPO** kolonu eklenecek.
* Satış tamamlama öncesi özel onay modalı gösterilecek.

### 4.3 Cari ve Cari Formu Kuralları

* Yeni cari oluşturulduğunda otomatik seçilme davranışı yeniden düzenlenecek.
* Cari listesi en yeni kayıttan eskiye doğru sıralanacak.

### 4.4 Personel Formu Kısıtlaması

* İşe giriş/doğum tarihi alanlarında bugün ve gelecek tarihler seçilemeyecek.

---

## 📌 5. MASTER SATIŞLAR & ONAYLAMA SÜREÇLERİ

### 5.2 Sevk & Teslim (Onaylama) İşlemleri

* Mavi göz = Görüntüleme

* Sarı kalem = Düzenleme

* Yeşil tik = Sevk/Teslim

* Kırmızı X = İptal

* Depo seçimi yapılmadan onay verilemeyecek.

* Stok hareketleri otomatik oluşturulacak.

* Kalan tahsilat ile ödeme toplamı eşleşmek zorunda olacak.

* Eşleşmezse "Lütfen kalanı sıfırlayın" uyarısı verilecek.

### 5.3 Satış Pasifleştirme & Silme

* Pasife alma durumunda stoklar ilgili depoya geri iade edilecek.
* Pasife alan kullanıcı ve sebep kaydedilecek.
* Silme işlemi için zorunlu açıklama alanı eklenecek.

### 5.4 Satış Düzenleme (Edit) Modeli

* Müşteri farklı adres seçeneği varsayılan açık gelecek.
* Lojistik verileri otomatik doldurulacak.
* A5 çıktıya uygun düzenleme şablonu hazırlanacak.

---

## 📌 6. BANKA HESAPLARI (HESAPLAR)

### 6.1 Liste ve Görünüm Değişiklikleri

* "İbana Ait Ad Soyad" sütunu eklenecek.
* Kritik Limit kolonu kaldırılacak.
* Aktif/Pasif kolonu kaldırılacak.
* Admin dışındaki kullanıcılar yalnızca kendilerine atanmış hesapları görebilecek.
* `#` sıra sütunu kaldırılacak.

### 6.2 Finansal İşlem Tipleri Entegrasyonu

* Cariden tahsilat

* Satıştan tahsilat

* Kasa transfer

* Dinamik filtreleme sistemi eklenecek.

* İlişkili kasalar üstte gösterilecek.

* Mükerrer kasa ekleme engellenecek.

---

## 📌 7. STOKLAR SAYFASI REVİZYONLARI

* Admin dışındaki kullanıcılar yalnızca kendi departmanlarının stoklarını görebilecek.
* Stok miktarı 0 olan ürünler listelenmeyecek.

---

## 📌 8. VERİTABANI VE ORM DEĞİŞİKLİKLERİ (BACKEND)

### 8.1 Yeni Veri Tabanı Kolonları (Migration Plan)

* `sales` tablosuna ikinci kapora alanı eklenecek.
* `sales` tablosuna:

  * `deactivated_by`
  * `deactivation_reason`
    alanları eklenecek.
* `commercial_accounts.critical_limit` alanı frontend listelerinde gizlenecek.

## 📌 9. SATIŞ SİPARİŞLERİ (Yeni Modül)

### 9.1 Satış Sipariş Modülü Ön Tanım

Satış siparişleri, ana satış modülünden bağımsız ve ayrı bir akış olarak ele alınmalıdır.

#### 9.1.1 Temel Akış

1. Sipariş oluşturulur (Müşteri, tarih, ödeme koşulları, ürünler)
2. Sipariş onaylanır (Status: `confirmed`)
3. Siparişten stok çıkışı yapılır (Stok modülü entegrasyonu)
4. Fatura kesilir (Stok modülü ile aynı fatura motoru)
5. Sipariş tamamlanır (Status: `completed`)

#### 9.1.2 Veritabanı Yapısı (Öneri)

**`sales_orders` tablosu**

* `id`
* `customer_id` (FK -> customers.id)
* `order_code` (Sipariş kodu)
* `status` (draft, confirmed, completed, cancelled)
* `order_date` (Sipariş tarihi)
* `payment_due_date` (Ödeme son gün)
* `order_type` (iç_ticaret, dış_ticaret)
* `total_amount` (Toplam tutar)
* `created_by` (FK -> users.id)
* `created_at`
* `updated_at`
* `updated_by`

**`sales_order_items` tablosu**

* `id`
* `order_id` (FK -> sales_orders.id)
* `product_id` (FK -> products.id)
* `quantity` (Miktar)
* `unit_price` (Birim fiyat)
* `total_price` (Toplam fiyat = quantity * unit_price)
* `tax_rate` (Vergi oranı)
* `tax_amount` (Vergi tutarı)
* `is_cancelled` (0/1)

#### 9.1.3 Yetkilendirme Kuralları

* **SATIŞ SİPARİŞLERİ – AÇIK**

  * Tüm departmanlar sadece kendi siparişlerini görebilir
  * Admin tüm siparişleri görebilir

* **SATIŞ SİPARİŞLERİ – YETKİLİ**

  * Tüm departmanlar sadece kendi siparişlerini görebilir
  * Admin tüm siparişleri görebilir

#### 9.1.4 UI /UX Özellikleri

* **Sipariş Özeti Modalı**

  * Tablo görünümünde sipariş özetini gösterir
  * Export → PDF/Excel
  * Gönder butonu → E-posta

* **Sipariş Oluşturma Ekranı**

  * Müşteri seçimi
  * Sipariş tipi seçimi (iç/dış)
  * Teslimat adresi
  * Son ödeme tarihi
  * Ürünler tablosu
  * Toplamlar ve KDV gösterimi
  * Kaydet / Onayla butonları

### 9.2 Sipariş ve Stok Entegrasyonu

#### 9.2.1 Onay Anı

* Sipariş onayıyla aynı anda stok modülünde rezervasyon yapılır
* Rezervasyon miktarı, siparişte belirtilen miktardır

#### 9.2.2 Sevk İşlemi

* Stok modülünden sevk yapıldığında, sipariş statüsü otomatik `completed` olarak güncellenir
* Eğer sevk miktarı eksikse, sipariş statüsü `partially_fulfilled` olarak işaretlenir

#### 9.2.3 Fatura İşlemi

* Stok çıkışı yapıldıktan sonra fatura oluşturulabilir
* Siparişle aynı ürünler ve tutarlar otomatik gelir

#### 9.2.4 İptal ve Deaktivasyon

* Sipariş iptal edildiğinde, daha önceden yapılmış stok rezervasyonları kaldırılır
* `cancelled_at` ve `cancelled_by` alanları kaydedilir

---

## 📌 10. DEPO MODÜLÜ

### 10.1 Depo Modülü Geliştirme

* Mevcut `stocks` tablosunu ayırmak için yeni `warehouses` tablosu
* Stok transfer işlemleri için yeni akış
* Depo bazlı stok takibi
* Departman bazlı depo ataması

---

## 📌 11. STOK HAREKETLERİ SAYFASI

### 11.1 Stok Hareketi Modülü Ön Tanım

* Satış, satın alma ve transfer hareketlerini tek bir merkezde toplama

### 11.2 Temel Akış

1. Satış siparişi → Stok çıkışı → Stok hareketi kaydedilir
2. Yeni alım siparişi → Stok girişi → Stok hareketi kaydedilir
3. Kasa transferi → Depo transferi → Stok hareketi kaydedilir
4.Manuel müdahale → Stok hareketi kaydedilir

### 11.3 Veritabanı Yapısı (Öneri)

**`stock_movements` tablosu**

* `id`
* `stock_id` (FK -> stocks.id)
* `product_id` (FK -> products.id)
* `movement_type` (giriş, çıkış, transfer)
* `quantity`
* `current_quantity` (hareket sonrası kalan miktar)
* `reference_type` (satış, alım, transfer, manuel)
* `reference_id` (FK -> sales.id / purchase_orders.id / transfers.id)
* `movement_date`
* `notes`
* `created_at`
* `created_by`
