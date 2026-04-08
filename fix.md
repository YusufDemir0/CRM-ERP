# 🔍 Ermay ERP/CRM — Hata ve Eksiklik Analiz Raporu

> **Tarih:** 2026-04-08  
> **Analiz Eden:** Antigravity AI  
> **Analiz Kapsamı:** Backend (NestJS) + Frontend (React/Vite) tam proje taraması

---

## 🔴 KRİTİK HATALAR (Acil Düzeltilmeli)

### 1. `@modules` Path Alias Çalışmıyor — Derleme Hatası
- **Dosya:** `backend/src/modules/sales/sales.service.ts` (satır 7)
- **Sorun:** `import { Item } from '@modules/inventory/items/entities/item.entity';` şeklinde `@modules` alias'ı kullanılmış. Ancak `nest-cli.json` dosyasında `tsconfig-paths` plugin'i tanımlı değil. Bu yüzden `nest build` ve `nest start` komutları runtime'da bu import'u çözemez ve hata verir.
- **Çözüm:** 
  - `nest-cli.json` dosyasına `"plugins": []` ve `compilerOptions` altına `"tsConfigPath": "tsconfig.json"` ekle
  - **VEYA** (daha güvenilir) bu import'u relative path'e çevir: `import { Item } from '../inventory/items/entities/item.entity';`

### 2. `item.brand` ve `item.model` Alanları Entity'de Yok ama Query'de Kullanılıyor
- **Dosya:** `backend/src/modules/inventory/items/items.service.ts` (satır 31)
- **Sorun:** `findAll` metodundaki arama sorgusu `item.brand LIKE :s OR item.model LIKE :s` kullanıyor ama `Item` entity'sinde `brand` ve `model` alanları tanımlı değil. Bu, arama yapıldığında MySQL'den `Unknown column` hatası fırlatır.
- **Çözüm:** Ya entity'ye `brand` ve `model` alanlarını ekle, ya da query'den bu alanları çıkar.

### 3. `Item.providerId` Alanı Entity'de Tanımlı Değil — DTO-Entity Uyumsuzluğu
- **Dosya:** `backend/src/modules/inventory/items/entities/item.entity.ts`
- **Sorun:** Entity'de `providerId` property'si yok, sadece `@JoinColumn({ name: 'provider_id' })` ile `provider` relation tanımlı. Ancak DTO'da `providerId` gönderiliyor ve `items.service.ts`'de `...dto` ile spread edilerek entity'ye aktarılıyor. TypeORM bu alanı görmezden gelecektir — provider hiçbir zaman set edilmez.
- **Çözüm:** Entity'ye `@Column({ name: 'provider_id', type: 'bigint', nullable: true }) providerId: number | null;` ekle.

### 4. CORS Yapılandırması Çelişkili — `origin: '*'` ile `credentials: true` Birlikte Kullanılamaz
- **Dosya:** `backend/src/main.ts` (satır 13-17)
- **Sorun:** `origin: '*'` ve `credentials: true` birlikte kullanıldığında tarayıcılar CORS isteğini reddeder. Bu spesifikasyon gereğidir.
- **Çözüm:** Ya `origin: '*'` yerine belirli origin (`http://localhost:5173`) yazılmalı, ya da `credentials: false` yapılmalı.

### 5. `window.location.reload()` — Her POST/PUT/DELETE'ten Sonra Sayfa Yeniden Yükleniyor
- **Dosya:** `frontend/src/services/api.ts` (satır 29)
- **Sorun:** API interceptor'ında başarılı POST/PUT/DELETE isteklerinden sonra `setTimeout(() => window.location.reload(), 1000)` çağrılıyor. Bu, React state'ini yok eder, SPA deneyimini bozar ve form verilerini/navigation state'ini kaybettirir.
- **Çözüm:** `window.location.reload()` kaldırılmalı. Yerine ilgili sayfada state güncellemesi veya React Query / callback bazlı refetch kullanılmalı.

---

## 🟠 ÖNEMLİ SORUNLAR (Kısa Vadede Düzeltilmeli)

### 6. Duplike Proje Yapısı — Root'ta ve `ermaycrmerp/backend`'de Ayrı Backend'ler
- **Dosya:** `/home/yusuf/ermany/` vs `/home/yusuf/ermany/ermaycrmerp/backend/`
- **Sorun:** Root `/home/yusuf/ermany/` dizininde de `package.json`, `tsconfig.json`, `src/`, `node_modules/` var. Bu, `ermaycrmerp/backend` ile neredeyse aynı içeriğe sahip ayrı bir NestJS projesi. Root'taki `package.json`'da `@nestjs/throttler` bile eksik. Hangi dizinden çalıştırıldığına bağlı olarak farklı davranışlar ortaya çıkar.
- **Çözüm:** Hangi dizinin asıl backend olduğu netleştirilmeli. Root dizin (eski versiyon) temizlenmeli veya monorepo yapısına geçilmeli.

### 7. `Sale.kdv` Alanı Precision Sorunu — `decimal(5,2)` Toplam KDV İçin Yetersiz
- **Dosya:** `backend/src/modules/sales/entities/sale.entity.ts` (satır 44)
- **Sorun:** `kdv` alanı `decimal(5,2)` olarak tanımlı, bu da max 999.99 değerine izin verir. Ancak bu alan toplam KDV tutarını tutuyor (oran değil). Büyük siparişlerde (örneğin 50.000₺ tutar, %20 KDV = 10.000₺) bu alan yetmez ve veri kesilir.
- **Çözüm:** `precision: 15, scale: 2` olarak güncelle (diğer decimal alanlarla tutarlı).

### 8. CSS Değişkenleri Tanımsız — DataTable ve Toaster Bozuk Görünüm
- **Dosya:** `frontend/src/styles/index.css` + `frontend/src/components/DataTable.tsx`
- **Sorun:** DataTable component'i inline `<style>` bloğunda birçok CSS değişkeni kullanıyor ama bunlar `index.css`'teki `:root` bloğunda tanımsız:
  - ❌ `--bg-card` → tanımsız (olması gereken: `--surface`)
  - ❌ `--bg-app` → tanımsız (olması gereken: `--background`)
  - ❌ `--accent` → tanımsız (olması gereken: `--primary`)
  - ❌ `--accent-glow` → tanımsız (olması gereken: `--primary-glow`)
  - ❌ `--accent-light` → tanımsız
  - ❌ `--danger` → tanımsız (olması gereken: `--error`)
  - ❌ `--bg-sidebar` → tanımsız (olması gereken: `--inverse-surface`)
  - ❌ `--radius-md` → tanımsız (Toaster'da kullanılıyor)
  - ❌ `--shadow-lg` → tanımsız (Toaster'da kullanılıyor)
- **Çözüm:** `:root` bloğuna eksik CSS değişkenlerinin alias'larını ekle.

### 9. Layout.tsx'de Tailwind-Benzeri Class'lar Kullanılıyor ama Tailwind Yok
- **Dosya:** `frontend/src/components/Layout.tsx` (satır 11-18)
- **Sorun:** Loading spinner bölümünde `flex`, `items-center`, `justify-center`, `h-screen`, `bg-background`, `text-on-surface`, `p-12`, `gap-6`, `w-12`, `h-12`, `rounded-2xl`, `bg-primary/10`, `animate-pulse`, `animate-spin` gibi Tailwind class'ları kullanılıyor. Projede Tailwind yüklü değil, dolayısıyla loading ekranı tamamen bozuk görünür.
- **Çözüm:** Tailwind class'larını vanilla CSS ile değiştir veya inline style kullan.

### 10. `SalesController` Route Sıralaması — `GET /sales/status` Çakışması
- **Dosya:** `backend/src/modules/sales/sales.controller.ts`
- **Sorun:** `@Get('status')` endpoint'i (satır 75) `@Get(':id')` endpoint'inden (satır 30) sonra tanımlanmış. NestJS'de route eşleştirme sırasına göre çalışır. `GET /sales/status` isteği `@Get(':id')` tarafından yakalanır ve `status` string'i `parseInt` ile NaN'e dönüşür → hata.
- **Çözüm:** `@Get('types')` ve `@Get('status')` route'larını `@Get(':id')`'den ÖNCE tanımla.

### 11. Dashboard Service — Gerçek Satış Verisi Eksik
- **Dosya:** `backend/src/modules/dashboard/dashboard.service.ts`
- **Sorun:** Dashboard'da `salesCount` olarak `transactions` count'u gösteriliyor. Gerçek satış sayısı (`Sale` tablosu) hiç sorgulanmıyor. `criticalStocks` da sadece aktif ürün sayısını döndürüyor, gerçek kritik stok kontrolü yapmıyor.
- **Çözüm:** Dashboard service'e `Sale` entity'sini ekle ve gerçek satış/stok verilerini sorgula.

---

## 🟡 ORTA SEVİYE SORUNLAR

### 12. `SettingsPage` Route Var ama Backend Endpoint Yok
- **Dosya:** `frontend/src/App.tsx` → `/settings` route'u
- **Sorun:** SettingsPage frontend'de mevcut ama backend'de bir `/settings` veya `/api/settings` endpoint'i bulunmuyor. Sayfa muhtemelen sadece lokal ayarları (tema vs.) yönetiyor olabilir ama bu netleştirilmeli.

### 13. `ProtectedRoute` — Rol Kontrolü Case-Sensitive
- **Dosya:** `frontend/src/components/ProtectedRoute.tsx` (satır 26)
- **Sorun:** `allowedRoles` kontrolü `user.roles.some(r => allowedRoles.includes(r))` şeklinde direkt string karşılaştırma yapıyor. Sidebar'da ise `r.toLowerCase()` ile kontrol yapılıyor — tutarsızlık var.
- **Çözüm:** Her iki tarafta da case-insensitive karşılaştırma yap.

### 14. `login-form` CSS Class'ı İki Kez Tanımlı
- **Dosya:** `frontend/src/styles/index.css` (satır 667 ve satır 799)
- **Sorun:** `.login-form` sınıfı CSS dosyasında iki kez tanımlanmış, farklı stiller veriyor. İkincisi birincisini ezer. Login sayfasının eski ve yeni tasarım stilleri karışmış.
- **Çözüm:** Eski login stilleri (satır 726-874) temizlenmeli veya ayrı class'a taşınmalı.

### 15. `.input-group label` → `font-size: 0px` — Label'lar Görünmez
- **Dosya:** `frontend/src/styles/index.css` (satır 806)
- **Sorun:** `.input-group label` için `font-size: 0px` tanımlanmış. Bu, label'ları tamamen görünmez yapar.
- **Çözüm:** `font-size` değerini `14px` veya uygun bir boyut ile değiştir.

### 16. `login-alert` → `font-size: 25px` — Hata Mesajı Dev Boyutta
- **Dosya:** `frontend/src/styles/index.css` (satır 791)
- **Sorun:** `.login-alert` class'ının font-size'ı `25px` olarak ayarlanmış. Bu aşırı büyük bir boyut.
- **Çözüm:** `font-size: 14px` yapılmalı.

### 17. `SalesWizard.tsx` Dosyası — Dosya Yapısı Karışık
- **Dosya:** `frontend/src/pages/modules/SalesWizard.tsx` (27KB)
- **Sorun:** `SalesWizard` componenti `SalesPage.tsx` tarafından import ediliyor ama `SalesPage.tsx` ayrı bir `pages/` kökünde (modules içinde değil). Bu yapı kafa karıştırıcı.

### 18. Eksik `tsconfig.build.json` — Backend Build Sırasında Sorun
- **Dosya:** `backend/` dizini
- **Sorun:** `ermaycrmerp/backend/` dizininde `tsconfig.build.json` dosyası yok. `nest build` komutu bu dosyayı arar.
- **Çözüm:** Backend dizinine oluşturulmalı:
  ```json
  { "extends": "./tsconfig.json", "exclude": ["node_modules", "test", "dist", "**/*spec.ts"] }
  ```

---

## 🔵 İYİLEŞTİRME ÖNERİLERİ

### 19. `.env` Dosyası Git'te Olmamalı
- **Dosya:** `backend/.env`
- **Sorun:** JWT secret ve veritabanı şifresi gibi hassas bilgiler `.env` dosyasında. `.gitignore`'da `.env` kontrolü yapılmalı. Production'da farklı ve güçlü secret kullanılmalı.

### 20. `forbidNonWhitelisted: true` — Sıkı DTO Validasyonu Dikkat
- **Dosya:** `backend/src/main.ts` (satır 23)
- **Sorun:** `forbidNonWhitelisted: true` ile DTO'da tanımlı olmayan herhangi bir alan gönderildiğinde 400 hatası döner. Frontend'den fazladan field gelirse (örneğin `id` alanı) istek reddedilir.

### 21. `usePersistentForm.ts` — Kullanılmıyor
- **Dosya:** `frontend/src/hooks/usePersistentForm.ts`
- **Sorun:** Projedeki hiçbir sayfada import edilmiyor. Dead code.

### 22. `navHub.ts` — Kullanılmıyor
- **Dosya:** `frontend/src/utils/navHub.ts`
- **Sorun:** Hiçbir sayfadan import edilmiyor. Dead code.

### 23. Test Dosyaları Hiç Yok
- **Dosya:** Tüm proje geneli
- **Sorun:** Backend ve frontend'de hiçbir test dosyası yok. Jest yapılandırması mevcut ama test dosyaları eksik.

### 24. `eslint` Yapılandırması Eksik
- **Dosya:** Hem backend hem frontend
- **Sorun:** `package.json`'da `lint` script'i var ama `.eslintrc.js` yapılandırma dosyası görünmüyor.

### 25. `README.md` Dosyası Yok
- **Sorun:** Projenin ne olduğunu, nasıl kurulacağını ve çalıştırılacağını açıklayan bir README dosyası eksik.

---

## 📊 ÖZET TABLO

| Seviye | Sayı | Açıklama |
|--------|------|----------|
| 🔴 Kritik | 5 | Derleme veya runtime hatalarına neden olan sorunlar |
| 🟠 Önemli | 6 | İşlevselliği bozan veya ciddi UX sorunlarına neden olan |
| 🟡 Orta | 7 | Tutarsızlıklar ve görsel/stil sorunları |
| 🔵 İyileştirme | 7 | Best practice ve bakım önerileri |
| **TOPLAM** | **25** | |

---

## ✅ DÜZELTİLMESİ ÖNERİLEN SIRASI

1. **#1** `@modules` path alias → relative path'e çevir
2. **#2** `brand`/`model` alanları → entity'den veya query'den kaldır
3. **#3** `providerId` alanı → entity'ye ekle
4. **#4** CORS yapılandırması → `origin` ayarla
5. **#5** `window.location.reload()` → kaldır
6. **#10** Route sıralaması → status/types'ı önce taşı
7. **#7** `Sale.kdv` precision → decimal(15,2) yap
8. **#8** CSS değişkenleri → eksik alias'ları ekle
9. **#9** Layout Tailwind class'ları → vanilla CSS'e çevir
10. **#14-16** CSS duplikasyonları ve hatalı font boyutları → düzelt
