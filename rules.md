Ermay ERP — Mutlak Yazılım Geliştirme Kuralları (Strict Rules)
Bu doküman, Ermay ERP projesinde (ve Antigravity altyapısını kullanan tüm projelerde) kesinlikle uyulması zorunlu, tavizsiz mimari, güvenlik, backend, frontend, veritabanı, iş mantığı ve kalite kurallarını kapsar.
Her kural, daha önce yaşanmış ya da potansiyel bir hatanın önüne geçmek için yazılmıştır.
Bu kuralların hiçbirine istisna yoktur. İhlal durumunda işlem derhal durdurulur ve düzeltme zorunludur.

1. VERSİYON KONTROLÜ VE COMMIT STANDARTLARI

Her mantıksal adımda commit zorunludur. Birden fazla mantıksal değişiklik tek commitle birleştirilemez (modül oluşturma, bug fix, refactoring, CSS değişikliği vb.).
Conventional Commits formatı zorunludur: feat:, fix:, refactor:, style:, docs:, chore: vb.
Her commit sonrası yapılan değişiklik kullanıcıya (ya da AI asistanına) kısa ve net biçimde özetlenmelidir.


2. GÜVENLİK (SECURITY FIRST)
2.1 Hata Mesajları ve Bilgi Sızıntısı

Veritabanı hata mesajları (tablo adı, kolon adı, constraint vb. içeren QueryFailedError vb.) asla API response’una yansıtılmaz.
Tüm DB hataları logger.error(exception) ile sunucu tarafında loglanır. İstemciye sadece soyut mesaj döner:
"İşlem başarısız. Lütfen tekrar deneyin."
HTTP 500 yanıtları hiçbir zaman stack trace veya internal mesaj içermez.

2.2 CSRF Koruması

JWT HttpOnly cookie ile saklanıyorsa CSRF koruması zorunludur.
SameSite=Strict veya Lax tek başına yeterli değildir. Double Submit Cookie ya da csurf middleware kullanılmalıdır.
Tüm state-changing endpoint’ler (POST, PUT, PATCH, DELETE) CSRF token doğrulaması yapar.

2.3 JWT Token İptali (Revocation)

Token süresi dolmadan kullanıcı devre dışı bırakıldığında (hesap askıya alma, kovulma vb.) token geçersiz sayılır.
JwtStrategy.validate() her istekte veritabanı veya Redis’ten kullanıcının state === 1 olup olmadığını kontrol etmelidir.
Redis blacklist + cache TTL (token süresiyle aynı) kullanılmalıdır.

2.4 DTO Validasyonu — Gerçek Bariyer

TypeScript tipleri compile-time’da silinir. Runtime güvence class-validator dekoratörleridir.
Her DTO’da tüm alanlar için @IsString, @IsNumber, @IsEnum, @IsIn, @Min, @Max, @Type(() => Number) vb. eksiksiz yazılır.
enableImplicitConversion: true yasaktır.
Serbest string alanlar (sortOrder vb.) mutlaka @IsIn(['ASC', 'DESC']) ile kısıtlanır.

2.5 Route Yetkilendirme

Frontend menü gizleme sadece UX’tir, güvenlik değildir.
Her protected route’a <ProtectedRoute allowedRoles={['admin', 'manager']}> ile bileşen seviyesinde kontrol eklenir.
Gerçek güvenlik backend Guard’lara aittir.


3. VERİTABANI VE TRANSACTION YÖNETİMİ
3.1 Atomicity — Her Kritik İşlem Transaction İçinde

Birden fazla tabloyu etkileyen her işlem (QueryRunner ile) transaction’a alınır.
try/catch/finally bloğu eksiksiz yazılır: hata → rollback, başarı → commit, her durumda release.

3.2 Deadlock Önleme — Sabit Kilit Sırası

Birden fazla satır kilitleniyorsa her zaman ID sırasına göre (küçükten büyüğe) kilit alınır.

3.3 Soft Delete ve İş Kuralı Kontrolleri

Bakiyesi sıfır olmayan cari, içinde işlem olan stok kalemi, aktif BOM’u olan ürün silinemez.
Bu kontroller sadece UI’da değil, servis katmanında uygulanır.

3.4 Finansal Hesaplamalar — Decimal Bütünlüğü

Tüm parasal değerler Decimal.js ile işlenir. Native number/Float kesinlikle yasaktır.
TypeORM.increment() metoduna .toNumber() geçirilmez; raw SQL ile Decimal string olarak güncellenir.

3.5 MySQL/MariaDB Özel Kuralı

Partial Index (@Index({ where: "..." })) desteklenmez. Unique + soft delete kombinasyonu application-level kontrol ile sağlanır.


4. MİMARİ VE BACKEND TASARIMI
4.1 Bounded Context — Modüller Arası İzolasyon

Bir modülün servisi, başka modülün repository’sine doğrudan erişemez.
İletişim sadece:
Diğer modülün public servisi
EventEmitter2 ile domain event
üzerinden yapılır.


4.2 Import Tutarlılığı

require() yasaktır. Sadece import kullanılır.

4.3 Loglama

Log interceptor’lar hafif ve asenkron olmalıdır.
Hassas alanlar (password, token, cvv) maskelenmeden asla loglanmaz.

4.4 Timezone Yönetimi

Tüm veritabanı yazmaları UTC’dir.
Raporlama ve sorgular UTC tabanlı yazılır. İstanbul saati uygulama katmanında hesaplanıp parametre olarak geçilir.


5. FRONTEND MİMARİSİ
5.1 TypeScript — any Yasaktır

any kullanımı kod review’da bloklanır. Tüm state, prop ve handler’lar açıkça tiplendirilir.
API response’ları Zod schema ile parse edilir.

5.2 Global State

window.dispatchEvent yasaktır. Zustand veya React Context kullanılır.

5.3 Bileşen Boyutu ve Yapısı

Tek bir component dosyası 200 satırı geçemez.
Wizard/multi-step formlar ayrı bileşenlere bölünür.
Veri mantığı hook’lara taşınır (useCartFinances, useSalesWizard vb.).

5.4 Stil Kuralları

Inline CSS (style={{}}) yasaktır (sadece dinamik hesaplamalı değerler hariç).
Tailwind CSS utility sınıfları zorunludur. Gerektiğinde CSS Modules kullanılır.
e.target.style ile stil değiştirme yasaktır.

5.5 useEffect ve Performans

Her async useEffect AbortController ile temizlenmelidir.
Listelerdeki onChange handler’ları useCallback ile memoize edilir.
Pahalı hesaplamalar useMemo içine alınır.
Büyük listelerde react-window (sanal scroll) değerlendirilir.

5.6 Hardcoded İş Kuralları Yasaktır

“Korunan birimler”, “varsayılan roller”, “sistem kategorileri” gibi değerler backend’den (isSystemProtected: boolean vb.) gelir. Frontend sadece render eder.


6. İŞ MANTIĞI VE DOMAIN KURALLARI

Her mali harekette mutlaka bir taraf (Party) belirtilmelidir. partyId null olan transaction reddedilir.
Karışık dövizli bakiyeler doğrudan toplanmaz; her biri anlık exchange rate ile TL’ye çevrilerek toplanır.
Tüm varlıklar (cari, stok, ürün) silinmeden önce iş kuralı kontrolleri servis katmanında yapılır.


7. PERFORMANS VE OPTİMİZASYON

Sık sorgulanan/join yapılan sütunlar mutlaka indeksli olmalıdır.
N+1 problemi joinAndSelect veya relations ile önlenir.
API yanıtlarından gereksiz veriler DTO ile ayıklanır.
Payload boyutu mümkün olduğunca küçültülür (compression önerilir).


8. TEST VE KALİTE

Her servis metodunun birim testi yazılır (DB etkileşimleri mock’lanır).
Kritik iş akışları (satış onayı, stok transferi, üretim tamamlama) integration test kapsamındadır.
PR açılmadan önce eslint ve tsc --noEmit hatasız geçmelidir.
any, @ts-ignore, eslint-disable kullanımları pull request’te gerekçelendirilmek zorundadır.


9. UI/UX VE AESTHETICS

Uygulama her zaman Enterprise Premium görünümünde olmalıdır.
Google Fonts (Inter, Outfit vb.) kullanılır; browser default fontları yasaktır.
Micro-animations (hover, loading, success) zorunludur.


Bu kurallar mutlak ve tavizsizdir.
Her geliştirici ve yapay zeka asistanı bu dokümana harfiyen uymak zorundadır.
Kuralların dışında herhangi bir işlem yapılırsa derhal durdurulmalı ve düzeltilmelidir.
Onaylandı ve yürürlüktedir.
Ermay ERP Geliştirme Ekibi