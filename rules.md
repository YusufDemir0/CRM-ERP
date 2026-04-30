# ERMAY ERP - MİMARİ VE KODLAMA KURALLARI (RULES.MD)

Bu doküman, Ermay ERP projesinin sürdürülebilirliği, güvenliği ve performansını korumak için uyulması gereken zorunlu kuralları içerir.

## 1. Tip Güvenliği (TypeScript)
- **Kesinlikle `any` Kullanılmayacak:** Tüm değişkenler, fonksiyon parametreleri ve dönüş değerleri açıkça tiplendirilmelidir. Tip bilinmiyorsa `unknown` kullanılmalı ve tip korumaları (type guards) ile daraltılmalıdır.
- **Strict Mode:** Proje `strict: true` modunda kalacaktır. `Object is possibly undefined` hataları opsiyonel zincirleme (`?.`) veya null kontrolleri ile çözülmelidir.
- **DTO Kullanımı:** API üzerinden gelen ve giden tüm veriler için DTO (Data Transfer Object) sınıfları kullanılmalıdır. `class-validator` ile validasyonlar yapılmalıdır.

## 2. Finansal Hesaplamalar (Precision)
- **Native Float Yasak:** Para birimi ve miktar hesaplamalarında asla native `number` ve `parseFloat` kullanılmamalıdır.
- **Decimal.js Zorunluluğu:** Tüm finansal matematik işlemleri (toplama, çıkarma, KDV hesabı, kur dönüşümü) `decimal.js` kütüphanesi ile yapılmalıdır.
- **Yuvarlama:** Hesaplamalar en az 10 hassasiyetle yapılmalı, display aşamasında `toDecimalPlaces(2)` ile yuvarlanmalıdır.

## 3. Olay Güdümlü Mimari (Event-Driven)
- **Transactional Outbox:** Kritik veritabanı işlemleri (Satış Onayı, Stok Hareketi vb.) mutlaka `Outbox` tablosuna yazılmalıdır.
- **Asenkron İşleme:** Outbox'a yazılan eventler bir Worker tarafından RabbitMQ'ya basılmalı ve Consumer'lar aracılığıyla işlenmelidir.
- **Bakiye ve Stok:** Stok düşme ve bakiye güncelleme işlemleri asla doğrudan Controller/Service içinde değil, event listener'lar (Consumer) üzerinden transactional olarak yapılmalıdır.

## 4. Veritabanı ve Performans
- **N+1 Problemi:** Döngü içinde veritabanı sorgusu atılmamalıdır. Bunun yerine `In([])` operatörü veya toplu join'ler kullanılmalıdır.
- **Selective Fetching:** `leftJoinAndSelect` ile tüm kolonları çekmek yerine, sadece ihtiyaç duyulan kolonlar `select()` ile belirtilmelidir.
- **Indexing:** Arama yapılan alanlarda (Kod, İsim, Vergi No) mutlaka veritabanı index'leri bulunmalıdır.

## 5. UI/UX Standartları
- **Premium Tasarım:** Tasarımlarda HSL design token'ları kullanılmalı, standart HTML renkleri yerine kurumsal palet tercih edilmelidir.
- **Geri Bildirim:** Tüm asenkron işlemler (Save, Update, Delete) `react-hot-toast` ile kullanıcıya bildirilmelidir.
- **Onay Mekanizması:** Silme ve iptal gibi geri dönüşü olmayan işlemler için mutlaka `confirmDialog` kullanılmalıdır.

## 6. Güvenlik
- **Permission Kontrolü:** Her API endpoint'i `@RequirePermissions` dekoratörü ile korunmalıdır.
- **Audit Logging:** Tüm kritik veri değişimleri `LogsService` üzerinden audit log olarak kaydedilmelidir.
- **Sensitive Data:** Loglarda şifre, token gibi hassas veriler mutlaka maskelenmelidir.

---
*Bu kurallar bütünü, sistemin "kurumsal" standartlarda kalmasını sağlar. Her yeni geliştirme bu kurallar süzgecinden geçirilmelidir.*
