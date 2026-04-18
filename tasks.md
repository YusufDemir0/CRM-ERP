# ERMAY ERP — TASK BOARD
> Versiyon: 1.1.0 | Güncelleme: Otomatik oluşturuldu  
> Her task implementation.md içindeki ilgili bölümle birebir eşleştirilmiştir.

---

## 🔴 KRİTİK — Canlıya Almadan Önce (P0)

Bu tasklar tamamlanmadan sistem production'a alınamaz.

---

### [TASK-011] Sequence Generator Race Condition — EŞ ZAMANLILIK KATLİAMI
**Dosya:** `src/items/sequence-generator.service.ts`  
**Etki:** Eş zamanlı ürün kaydında `TypeError: Cannot read properties of null` → işlem çöker, veri tutarsızlığı  
**Önce:** `findOne` → `save` → `catch (e) {}` → `getOne` → `null!.currentNumber` crash  
**Sonra:** Atomik `INSERT ... ON DUPLICATE KEY UPDATE` raw SQL  
**Tahmini Süre:** 2s  
**Test:** Aynı `itemCodeGroupId` için 50 eş zamanlı istek gönder, tüm kodlar unique ve sıralı olmalı  
- [ ] `SequenceGeneratorService.generateNextCode()` metodunu raw SQL ile yeniden yaz
- [ ] Eski `findOne` + `catch (e) {}` bloğunu sil
- [ ] Entegrasyon testi: concurrent request senaryosu

---

### [TASK-006] Decimal Parser Finansal Patlama
**Dosya:** `src/common/helpers/number.helper.ts`  
**Etki:** `1,000,000.50` girişi `100000050` olarak DB'ye yazılır → vergi dairesine açıkla  
**Önce:** Tek `,`/`.` kontrolü → hatalı global replace  
**Sonra:** Format tespitli, `parseFloat`-sız güvenli parser  
**Tahmini Süre:** 3s  
**Test:** `1.250,99` → `"1250.99"` | `1,000,000.50` → `"1000000.50"` | `1250` → `"1250"`
- [ ] `parseTurkishDecimal()` fonksiyonunu implementation.md'ye göre yeniden yaz
- [ ] Mevcut fonksiyonu kullanan tüm yerler için birim testi ekle
- [ ] Edge case'ler: para birimi sembolü, boşluk, negatif sayı

---

### [TASK-015] Hardcoded CORS → Production Erişim Engeli
**Dosya:** `src/main.ts`  
**Etki:** Deploy sonrası tüm kullanıcılar CORS Error alır, sisteme giremez  
**Önce:** `origin: ['http://localhost:5173', ...]` hardcoded  
**Sonra:** `ALLOWED_ORIGINS` env variable'dan parse  
**Tahmini Süre:** 30dk  
**Test:** `ALLOWED_ORIGINS=https://erp.ermay.com` ile sunucu başlat, farklı origin'den istek at
- [ ] `main.ts` CORS konfigürasyonunu env-based yap
- [ ] `.env.production` dosyasına `ALLOWED_ORIGINS` ekle
- [ ] `.env.example` güncelle
- [ ] CI/CD pipeline'da environment variable'ın set edildiğini doğrula

---

### [TASK-002] Timing Attack Korumaları
**Dosya:** `src/auth/auth.service.ts`, `src/webhooks/webhook.guard.ts`  
**Etki:** Login yanıt süresi farkından kullanıcı varlığı tespiti; imza brute-force  
**Tahmini Süre:** 2s  
**Test:** Var olan / olmayan kullanıcı için login yanıt sürelerini ölç (fark < 5ms olmalı)
- [ ] `webhook.guard.ts`: `===` karşılaştırmasını `crypto.timingSafeEqual` ile değiştir
- [ ] `webhook.guard.ts`: Uzunluk kontrolünü `timingSafeEqual`'dan önce ekle
- [ ] `auth.service.ts`: Kullanıcı bulunamadığında `DUMMY_HASH` ile `bcrypt.compare` çalıştır
- [ ] `DUMMY_HASH` değerini gerçek `bcrypt.hash('dummy', 12)` ile üret ve sabitle

---

### [TASK-014] TypeORM Pagination + JOIN → OutOfMemory
**Dosya:** `src/roles/roles.service.ts` (+ Users, Menu, tüm M-N ilişkili servisler)  
**Etki:** 10.000 rol, 50.000 yetki → Node.js RAM 1 GB → OOM Crash → sunucu düşer  
**Önce:** `leftJoinAndSelect` + `skip/take` → tüm veriyi RAM'e çeker  
**Sonra:** İki aşamalı sorgu: ID pagination → `WHERE id IN (...)` relations  
**Tahmini Süre:** 4s  
**Test:** 1000 rol, 500 yetki/rol ile yük testi → bellek kullanımını izle
- [ ] `roles.service.ts → findAll()`: İki aşamalı pagination uygula
- [ ] Aynı pattern'i kullanan diğer servisleri `grep -rn "leftJoinAndSelect" src/` ile tespit et
- [ ] Her birini güncelle
- [ ] `k6` veya `autocannon` ile yük testi

---

## 🟠 YÜKSEK ÖNCELİK — İlk Sprint (P1)

---

### [TASK-001] RabbitMQ Audit Log Entegrasyonu
**Dosya:** `src/logs/logs.service.ts`, `src/app.module.ts`  
**Etki:** Process restart → hafızadaki tüm loglar kaybolur; RAM baskısı  
**Tahmini Süre:** 1 gün  
- [ ] `npm install @nestjs/microservices amqplib` kur
- [ ] AppModule'e `ClientsModule.register(...)` ekle (durable queue)
- [ ] `LogsService.ts` içindeki `bufferTime` bloğunu tamamen sil
- [ ] `rmqClient.emit('audit_log', logData)` ile kuyruğa gönder
- [ ] `AuditLogConsumer` worker'ı oluştur (Manual ACK / NACK)
- [ ] DB hatasında NACK → kuyruğa geri dönüşü test et
- [ ] `RABBITMQ_URL` env variable dokümante et

---

### [TASK-013] SQL Wildcard DoS Koruması
**Dosya:** `src/logs/logs.service.ts` + tüm `LIKE` kullanan servisler  
**Etki:** `%%%%%` araması → full-table scan → DB CPU %100 → DoS  
**Tahmini Süre:** 3s  
**Test:** Arama kutusuna `%_%%_%_%` gir, DB CPU grafiğini izle
- [ ] `src/common/utils/sql.helper.ts` → `escapeLike()` fonksiyonunu yaz
- [ ] `grep -rn "LIKE :s" src/` ile tüm servisler listele
- [ ] Her birinde `escapeLike(query.search)` kullan
- [ ] `query.search` için max 100 karakter limiti ekle (DTO validation)

---

### [TASK-012] Circular Dependency — InventoryOrchestratorService
**Dosya:** `src/items/items.service.ts`  
**Etki:** Dynamic import hack → TypeORM connection pool baskısı, unit test imkânsız  
**Tahmini Süre:** 4s  
- [ ] `src/inventory/inventory-orchestrator.service.ts` oluştur
- [ ] Stok kontrolü + soft delete logic'ini buraya taşı
- [ ] `ItemsService.softDelete()` içindeki dynamic import bloğunu sil
- [ ] `ItemsController` → `InventoryOrchestratorService` kullanacak şekilde güncelle
- [ ] `InventoryModule` oluştur, `ItemsModule` ve `StocksModule`'ü import et
- [ ] `items.service.ts` unit testi ekle (mock ile)

---

### [TASK-016] Zustand + React Router Anti-Pattern
**Dosya:** `src/App.tsx`, `src/store/useAuthStore.ts`  
**Etki:** Component unmount → stale closure → logout yönlendirmesi çalışmaz  
**Tahmini Süre:** 2s  
- [ ] `AuthNavigationBridge` component'ini tamamen sil
- [ ] `useAuthStore`'dan `setRedirectToLogin` fonksiyonunu kaldır
- [ ] Axios interceptor'a 401 → `window.location.href = '/login'` ekle
- [ ] `api/axios.config.ts` dosyasını oluştur (veya var olanı güncelle)
- [ ] El ile test: token expire olduğunda login sayfasına yönlenme doğrula

---

### [TASK-003] Transaction Yönetimi Standartlaştırması
**Dosya:** `src/common/decorators/transactional.decorator.ts`, tüm servisler  
**Etki:** Custom decorator'da transaction propagation hataları; potansiyel veri tutarsızlığı  
**Tahmini Süre:** 1 gün  
- [ ] `npm install @nestjs-cls/transactional @nestjs-cls/transactional-adapter-typeorm nestjs-cls` kur
- [ ] `AppModule`'e `ClsPluginTransactional` ekle
- [ ] `transactional.decorator.ts` dosyasını sil
- [ ] `TransactionInternal` sınıfını kullanan tüm yerleri tespit et (`grep -rn "TransactionInternal" src/`)
- [ ] Her serviste `this.transactionContext.manager.save()` → `this.repo.save()` değiştir
- [ ] Tüm servislerdeki `@Transactional()` import'larını yeni paketten yap
- [ ] Kritik iş akışlarında (Satış, Satın Alma, Stok) entegrasyon testi

---

## 🟡 ORTA ÖNCELİK — İkinci Sprint (P2)

---

### [TASK-004] Kuruş Farkı Dağıtımı (Penny Rounding)
**Dosya:** `src/sales/sales.service.ts`  
**Etki:** E-fatura red; muhasebe uyumsuzluğu  
**Tahmini Süre:** 3s  
- [ ] `calculateLineKdvs()` metoduna "largest remainder" algoritması ekle
- [ ] `maxLineIndex` / `maxLineAmount` takibi implement et
- [ ] `difference.isZero()` kontrolü → en büyük kaleme ekle
- [ ] Birim testi: Farklı KDV oranları karışık 5 kalemli fatura → toplam tutarlı olmalı
- [ ] E-fatura test ortamında doğrula

---

### [TASK-005] Cascading Soft Delete Guard
**Dosya:** `src/parties/parties.service.ts`  
**Etki:** Aktif siparişli carinin silinmesi → ilişkisel bütünlük bozulur  
**Tahmini Süre:** 2s  
- [ ] `softDelete()` içine `Sale.count({ status: In([...]) })` kontrolü ekle
- [ ] Aktif sipariş varsa açıklayıcı mesajla `BadRequestException` fırlat
- [ ] Diğer ilişkisel kontroller: aktif teklif, bekleyen ödeme var mı?
- [ ] Frontend'de silme modal'ına uyarı mesajı ekle
- [ ] Test: Aktif siparişli cariyi silmeye çalış → hata mesajı doğrula

---

### [TASK-007] RBAC — Regex Yetki Kontrolü Kaldırma
**Dosya:** `src/migrations/`, `src/permissions/permission.entity.ts`, `frontend/src/pages/RolesPage.tsx`  
**Etki:** Yeni modül eklendiğinde manuel kod değişikliği; typo'ya karşı kırılgan  
**Tahmini Süre:** 4s  
- [ ] TypeORM migration oluştur: `permissions.action` kolonu ekle
- [ ] Mevcut verileri `key` adına göre `action` değerine migrate et (UPDATE sorgular)
- [ ] `Permission` entity'i güncelle
- [ ] `RolesPage.tsx`: `p.key.includes('view')` → `p.action === 'read'` değiştir
- [ ] Tüm frontend yetki filtrelerini gözden geçir
- [ ] Migration rollback testi

---

### [TASK-017] Timezone Yönetimi
**Dosya:** `src/common/utils/date.utils.ts`, ilgili frontend bileşenleri  
**Etki:** Gece 23:00 kesilen fatura ertesi/önceki gün kayıtlara girer; muhasebe sapması  
**Tahmini Süre:** 1 gün  
- [ ] Backend `DateUtils.parseLocalDate()` metodunu implement et (UTC-safe)
- [ ] Frontend tarih seçici bileşenlerinde `toISOString()` veya `sv-SE` locale kullan
- [ ] `Sale`, `Transaction` entity'lerinde `DATE` tipi kolonları string olarak refactor et
- [ ] Türkiye saatinde gece 23:00-00:00 arası tarih testi yaz
- [ ] Mevcut kayıtlarda tarih sapması olup olmadığını kontrol et (veri audit)

---

## 🟢 DÜŞÜK ÖNCELİK — Üçüncü Sprint (P3)

---

### [TASK-008] Form Verisi Kaybını Önleme
**Dosya:** `src/hooks/usePersistentForm.ts`, `src/stores/useSalesWizardStore.ts`  
**Etki:** Sekme kapanınca form uçar → kullanıcı deneyimi kötü  
**Tahmini Süre:** 2s  
- [ ] `usePersistentForm` hook'una `beforeunload` event listener ekle
- [ ] `useSalesWizardStore`'a `saveToStorageSync()` metodu ekle
- [ ] Zustand `persist` middleware ile localStorage entegrasyonunu doğrula
- [ ] Test: Formu doldur → sekmeyi kapat → yeniden aç → form dolu mu?

---

### [TASK-009] React Gereksiz Re-render Önleme
**Dosya:** `src/pages/SalesPage.tsx` + tüm listeleme sayfaları  
**Etki:** DataTable her render'da re-mount → performans kaybı, kullanıcı deneyimi  
**Tahmini Süre:** 2s  
- [ ] `SalesPage.tsx`: Tüm DataTable prop'larındaki inline arrow function'ları `useCallback` ile sar
- [ ] `PurchasesPage.tsx`, `ItemsPage.tsx`, `PartiesPage.tsx` vb. için aynı işlemi yap
- [ ] React DevTools Profiler ile re-render sayısını öncesi/sonrası karşılaştır
- [ ] `DataTable` bileşenini `React.memo` ile sar (henüz yoksa)

---

### [TASK-010] Z-Index Hiyerarşisi Standardizasyonu
**Dosya:** `tailwind.config.js`, tüm bileşenler  
**Etki:** Modal/dropdown/header z-index çakışmaları; UI hataları  
**Tahmini Süre:** 3s  
- [ ] `tailwind.config.js`'e semantic z-index token'larını ekle
- [ ] `grep -rn "z-\[" src/` ile tüm arbitrary değerleri tespit et
- [ ] Her birini uygun semantic token ile değiştir
- [ ] Görsel test: Modal üstünde header görünmemeli; dropdown modal'ı geçmemeli

---

### [TASK-018] DataTable key={index} Anti-Pattern
**Dosya:** `src/components/DataTable.tsx`  
**Etki:** Dinamik sütunlarda hücre state'leri yanlış satırlara kayar  
**Tahmini Süre:** 1s  
- [ ] `columns.map((col, idx) => ... key={idx})` → `key={col.accessor.toString()}` değiştir
- [ ] Satır hücreleri için `key={`${row.id}-${cell.columnId}`}` kullan
- [ ] `grep -rn "key={idx}" src/` → başka yer var mı kontrol et
- [ ] Test: Sütun sırasını değiştir → focus/input state'leri stabil kalmalı

---

## 📊 ÖZET TABLO

| Task ID | Başlık | Öncelik | Tahmini Süre | Durum |
|---------|--------|---------|--------------|-------|
| TASK-011 | Sequence Generator Race Condition | 🔴 P0 | 2s | ☐ |
| TASK-006 | Decimal Parser Finansal Patlama | 🔴 P0 | 3s | ☐ |
| TASK-015 | CORS Production Engeli | 🔴 P0 | 30dk | ☐ |
| TASK-002 | Timing Attack Korumaları | 🔴 P0 | 2s | ☐ |
| TASK-014 | TypeORM Pagination OOM | 🔴 P0 | 4s | ☐ |
| TASK-001 | RabbitMQ Audit Log | 🟠 P1 | 1 gün | ☐ |
| TASK-013 | SQL Wildcard DoS | 🟠 P1 | 3s | ☐ |
| TASK-012 | Circular Dependency Orchestrator | 🟠 P1 | 4s | ☐ |
| TASK-016 | Zustand Router Anti-Pattern | 🟠 P1 | 2s | ☐ |
| TASK-003 | Transaction Standardizasyonu | 🟠 P1 | 1 gün | ☐ |
| TASK-004 | Kuruş Farkı Dağıtımı | 🟡 P2 | 3s | ☐ |
| TASK-005 | Cascading Soft Delete Guard | 🟡 P2 | 2s | ☐ |
| TASK-007 | RBAC Regex Kaldırma | 🟡 P2 | 4s | ☐ |
| TASK-017 | Timezone Yönetimi | 🟡 P2 | 1 gün | ☐ |
| TASK-008 | Form Verisi Kaybı | 🟢 P3 | 2s | ☐ |
| TASK-009 | React Re-render useCallback | 🟢 P3 | 2s | ☐ |
| TASK-010 | Z-Index Standardizasyonu | 🟢 P3 | 3s | ☐ |
| TASK-018 | DataTable key={index} | 🟢 P3 | 1s | ☐ |

---

## 🔧 ORTAM HAZIRLIĞI (Deploy Öncesi)

```bash
# Tüm yeni paketleri kur
npm install @nestjs/microservices amqplib \
            @nestjs-cls/transactional \
            @nestjs-cls/transactional-adapter-typeorm \
            nestjs-cls

# Arbitrary z-index tarama
grep -rn "z-\[" src/

# LIKE sorgu tarama
grep -rn "LIKE :s" src/

# key={idx} tarama
grep -rn "key={idx}" src/

# leftJoinAndSelect tarama
grep -rn "leftJoinAndSelect" src/

# Dynamic import tarama
grep -rn "await import(" src/

# TransactionInternal tarama
grep -rn "TransactionInternal" src/
```

---

> 📌 **Kural:** P0 task'lar tamamlanmadan PR merge edilemez, staging deploy yapılamaz.  
> 📌 **Kural:** Her task için en az 1 birim/entegrasyon testi yazılmalıdır.  
> 📌 **Kural:** Implementation detayı için `implementation.md` içindeki ilgili bölüme bakınız.