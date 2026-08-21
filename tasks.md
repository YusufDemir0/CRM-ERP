# Ermay CRM-ERP Revizyon Görev Listesi (tasks.md)

Bu görev listesi, iş revizyon taleplerini adım adım takip etmek için hazırlanmıştır.

* [x] **2. Kişisel Notlar & Kullanıcı Ekranı**

  * [x] `NotesPage.tsx` içerisine "Satış hatası bildir" ve "Kendime not ekle" hızlı aksiyon butonlarını ve formlarını ekle.
  * [x] Kullanıcı listesi satırlarının başındaki profil/kullanıcı avatar logolarını kaldır.
  * [x] Kullanıcı oluşturma/düzenleme modalında hiç rol seçilmediğinde kırmızı renkte uyarı göster ve kaydetmeyi engelle.

* [/] **3. Yetkiler & Rol Tanımları**

  * [x] "Satış Yetkilisi" için varsayılan yetkileri güncelle (`YETKİLİ SATIŞLAR KAPALI`, diğerleri açık olacak şekilde).
  * [x] Admin olmayan kullanıcıların cari/müşteri listesinde sadece kendi departmanlarının oluşturduğu carileri listelemesi için API ve SQL sorgularını filtrele.
  * [x] `StocksPage.tsx` ekranında "Stok görüntüle" iznine göre stok ekleme/düzenleme butonlarını gizle.
  * [x] **Stok Hareket Miktarı ve Açıklama Düzeltmesi:**
      * [x] `StockMovement` entity'sindeki Decimal kolonlara `@Transform` dekoratörü ekle.
      * [x] `stocks-reports.service.ts` içerisindeki `findAllMovements` metodunda `sm.description` alanını seçime dahil et.
      * [x] `docker-compose.yml` dosyasındaki `backend-worker` başlangıç doğrulama hatasını gider.

* [x] **4. 11 Adımlı Satış Sihirbazı & Validasyonlar**

  * [x] `SaleWizard.tsx` adımlarını işletmenin belirttiği **11 adımdan oluşan hiyerarşik akışa** göre yeniden sırala.
  * [x] Ürün seçim listesindeki `#` (index) sütununu kaldır.
  * [x] Sihirbaz ürün seçim tablosuna sağ sona `SEVK / DEPO` kolonu ekle, varsayılan olarak kilitli ve "bekleyen" gelsin.
  * [x] Kapora tutarının toplam anlaşılan satış tutarından büyük olamayacağı doğrulamasını ekle.
  * [x] Kapora ve teklif tutarı girdi kutularına tıklanınca tüm metni otomatik seçtir (`ctrl + a` davranışı).
  * [x] Satışı tamamla butonunda temsilci adı, tutar, müşteri ad soyad, tarih ve gün bilgisiyle onay modalı açtır.
  * [x] Backend tarafında satış esnasında stok düşüşünü doğrudan `"sanaldepo"` deposundan adete göre yapacak şekilde entegre et.
  * [x] Yeni cari kaydedildiğinde sihirbazda cari otomatik seçili gelmesin ya da boşlukları tam doldursun.
  * [x] Cari listesini güncelden geçmişe göre sırala.
  * [x] Personel ekleme formunda doğum/işe giriş tarihi olarak bugün ve gelecek tarihlerin seçilmesini engelle.

* [x] **5. Master Satışlar & Sevk Onay Süreçleri**

  * [x] `MasterSalesPage.tsx` sayfasını oluştur (Tüm satışlar departmandan bağımsız listelenecek, işlemler aktif olacak).
  * [x] Onaylananlar sekmesindeki işlem butonlarını tasarıma uygun ikon ve renklere döndür (Göz -> Mavi, Kalem -> Sarı, Tik -> Yeşil, X -> Kırmızı).
  * [x] Depo seçilmeden `satisdepo` kalırsa "Lütfen depo seçiniz" uyarısı verdir ve engelle.
  * [x] Depodan ürün adeti kadar stok düşümünü yap, `satisdepo` deposuna "Satıştan iade. (Bedo)" açıklamalı iade hareketi ekle.
  * [x] Sevk aşamasındaki kalan tutar tahsilatında nakit ve diğer ödemeleri ayrı ayrı kasa hareketi yap.
  * [x] Toplam ödemenin kalan tutara eşit olduğunu kontrol et, eşit değilse "Lütfen kalanı sıfırlayın" uyarısı ver.
  * [x] Satış silme modalına TextBox ekle, boşsa silmeyi engelle.
  * [x] Satış pasif edildiğinde hangi depodan çıkış yapıldıysa stoğu oraya iade et, pasif eden kişi ve sebebi kaydet.
  * [x] Düzenleme sayfasında "Müşteri farklı adres" seçeneğini varsayılan olarak seçili getir ve lojistik aşamasındaki tüm verileri otomatik doldurt.

* [/] **6. Hesaplar & Finans Revizyonları**

  * [x] Hesap listesinde "İbana Ait Ad Soyad" (ibanName) sütununu ekle.
  * [ ] Kritik Limit ve Aktif/Pasif sütunlarını listeden kaldır.
  * [ ] Admin harici kullanıcıların sadece kendilerine atanmış kasa ve hareketlerini görmesini sağla.
  * [ ] Finansal işlem tiplerini entegre et (1- cariden tahsilat, 2- satıştan tahsilat (kapora 2 dahil), 3- kasa transfer).
  * [ ] Kasa ve mağazalara göre dinamik filtreleri sayfa üstüne ekle.

* [/] **7. Stoklar Sayfası**

  * [ ] Admin harici kullanıcıların sadece kendi departmanlarına ait depo stok ve hareketlerini görmesini sağla.
  * [x] Stok adeti 0 olan ürünleri listede gösterme.
