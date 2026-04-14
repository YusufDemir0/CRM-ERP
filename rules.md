# Ermay ERP - Geliştirme Kuralları (Strict Rules)

Bu belge, proje gelişim süreci boyunca uyulması zorunlu, sert ve tavizsiz kuralları içerir. Yapay zeka asistanı ve geliştiriciler bu kuralları ihlal edemez.

## 1. Versiyon Kontrolü ve Commit Standartları
- **Her Adım Sonunda Commit**: Yapılan her bir mantıksal işlem (modül oluşturma, bug fix, refactoring, CSS güncellemesi vb.) sonrasında **mutlaka** git commit atılacaktır. Birden fazla adım birleştirilemez.
- **Conventional Commits**: Commit mesajları dünya standartlarında (feat, fix, refactor, style, docs, chore) formatında ve açıklayıcı olmalıdır.
- **Değişiklik Bildirimi**: Her commit sonrası yapılan işlem kullanıcıya kısaca özetlenmelidir.

## 2. Mimari ve Kod Kalitesi (Syntax)
- **DTO Zorunluluğu**: Tüm API yanıtları ve istekleri için (Input/Output) kesinlikle DTO kullanılmalıdır. `plainToInstance` ile dönüşüm yapılmadan ham veri dönülemez.
- **Tip Güvenliği**: TypeScript `any` kullanımı en katı şekilde yasaktır. Tanımlanmamış tip kalmamalıdır.
- **Financial Integrity**: Finansal hesaplamalarda asla `Float/Number` kullanılmaz. Mutlaka `Decimal.js` veya veritabanı seviyesinde `DECIMAL(15,4)` hassasiyeti korunmalıdır.

## 3. Güvenlik (Security First)
- **Girdi Doğrulama**: Tüm DTO'lar `class-validator` ile en sıkı şekilde doğrulanmalıdır.
- **SQL Injection**: Tüm sorgular TypeORM QueryBuilder veya Repository üzerinden parametrik olarak yapılmalı, `orderBy` gibi dinamik alanlar whitelist kontrolünden geçirilmelidir.
- **Sızdırmazlık**: `LogsInterceptor` ve benzeri yapılar hassas verileri (şifre, token vb.) asla loglamamalıdır.

## 4. Performans ve Optimizasyon
- **Database Indexing**: Sık sorgulanan veya join yapılan sütunlar mutlaka indeksli olmalıdır.
- **Payload Size**: Gereksiz veriler API yanıtlarından (DTO aracılığıyla) ayıklanmalıdır. Gerekli yerlerde `compression` kullanılmalıdır.
- **N+1 Problemi**: Tüm ilişkisel sorgular `joinAndSelect` veya `relations` ile optimize edilmeli, döngü içinde veritabanı sorgusu atılmamalıdır.

## 5. UI/UX ve Aesthetics
- **Premium Design**: Uygulama her zaman "Enterprise Premium" görünümünde olmalıdır. Sıradan HTML/CSS tasarımları kabul edilemez.
- **Modern Typography**: Google Fonts (Inter, Outfit vb.) kullanılmalı, browser default fontları yasaktır.
- **Micro-Animations**: Kullanıcı etkileşimi (hover, loading, success) animasyonlarla desteklenmelidir.

---

**NOT:** Bu kuralların dışına çıkılması durumunda işlem derhal durdurulmalı ve hata düzeltilmelidir.
