# ERMAY ERP — IMPLEMENTATION GUIDE
> Versiyon: 1.1.0 | Durum: CRITICAL / MANDATORY  
> Her başlık ilgili `tasks.md` task ID'siyle eşleştirilmiştir.

---

## BÖLÜM 1 — BACKEND MİMARİSİ & GÜVENLİK

---

### [TASK-001] RabbitMQ Audit Log Entegrasyonu

**Sorun:** `LogsService.ts` içindeki `bufferTime` tabanlı in-memory log tampon mekanizması; Node.js process'i crash ettiğinde veya pod restart olduğunda hafızadaki tüm logları kaybeder. RAM birikimiyle bellek baskısı yaratır.

**Kurulum:**
```bash
npm install @nestjs/microservices amqplib
```

**Adım 1 – RabbitMQ bağlantı modülü (AppModule):**
```typescript
// app.module.ts
import { ClientsModule, Transport } from '@nestjs/microservices';

ClientsModule.register([
  {
    name: 'AUDIT_LOG_SERVICE',
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: 'audit_logs_queue',
      queueOptions: { durable: true },
      noAck: false, // Manual ACK zorunlu
    },
  },
]),
```

**Adım 2 – LogsService refactor:**
```typescript
// logs/logs.service.ts
@Injectable()
export class LogsService {
  constructor(
    @Inject('AUDIT_LOG_SERVICE') private readonly rmqClient: ClientProxy,
  ) {}

  // ESKİ bufferTime bloğunu TAMAMEN SİL
  // YENİSİ:
  async emitLog(logData: AuditLogDto): Promise<void> {
    this.rmqClient.emit('audit_log', logData);
  }
}
```

**Adım 3 – Consumer Worker (Manual ACK):**
```typescript
// audit-log.consumer.ts
@Controller()
export class AuditLogConsumer {
  constructor(private readonly logsRepo: Repository<AuditLog>) {}

  @EventPattern('audit_log')
  async handleAuditLog(
    @Payload() data: AuditLogDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      await this.logsRepo.save(data);
      channel.ack(originalMsg); // Başarı → kuyruktan sil
    } catch (err) {
      channel.nack(originalMsg, false, true); // Hata → kuyruğa geri koy
    }
  }
}
```

---

### [TASK-002] Timing Attack Korumaları

**Sorun 1 — `webhook.guard.ts`:** `===` ile string karşılaştırması, işlem süresinden imza bilgisini sızdırır (timing attack).

```typescript
// webhook.guard.ts
import * as crypto from 'crypto';

const digest  = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
const expected = Buffer.from(`sha256=${digest}`, 'utf8');
const received  = Buffer.from(signature, 'utf8');

if (expected.length !== received.length) {
  throw new UnauthorizedException('Geçersiz İmza');
}
if (!crypto.timingSafeEqual(expected, received)) {
  throw new UnauthorizedException('Geçersiz İmza');
}
```

> ⚠️ Uzunluk kontrolü `timingSafeEqual`'dan **önce** yapılmalıdır; farklı uzunluktaki tamponları karşılaştırmak exception fırlatır.

**Sorun 2 — `auth.service.ts`:** Kullanıcı bulunamadığında bcrypt atlanırsa, yanıt süresi login başarısına göre ölçülebilir hale gelir.

```typescript
// auth/auth.service.ts
// cost:12 değerinde önceden üretilmiş sabit sahte hash
const DUMMY_HASH =
  '$2b$12$e/9Xz1n0b1V1X1X1X1X1X.O1X1X1X1X1X1X1X1X1X1X1X1X1X1X1X';

async login(dto: LoginDto) {
  const user = await this.usersRepo.findOne({ where: { username: dto.username } });

  if (!user) {
    await bcrypt.compare(dto.password, DUMMY_HASH); // CPU süresi normalize et
    throw new UnauthorizedException('Kullanıcı adı veya şifre hatalı');
  }

  const valid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!valid) throw new UnauthorizedException('Kullanıcı adı veya şifre hatalı');
  // ...token üret
}
```

---

### [TASK-003] Transaction Yönetimi Standartlaştırması

**Sorun:** Kendi yazılan `@Transactional()` decorator ve `TransactionInternal` sınıfı hatalı context propagation yapıyor; transaction dışı save çağrıları bağımsız transaction açabilir.

**Kurulum:**
```bash
npm install @nestjs-cls/transactional @nestjs-cls/transactional-adapter-typeorm nestjs-cls
```

**Adım 1 – AppModule kayıt:**
```typescript
// app.module.ts
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

ClsModule.forRoot({
  plugins: [
    new ClsPluginTransactional({
      imports: [TypeOrmModule],
      adapter: new TransactionalAdapterTypeOrm({ dataSourceToken: DataSource }),
    }),
  ],
}),
```

**Adım 2 – Servis kullanımı:**
```typescript
// sales/sales.service.ts
import { Transactional } from '@nestjs-cls/transactional';

@Injectable()
export class SalesService {
  constructor(private readonly saleRepo: Repository<Sale>) {}

  @Transactional() // Artık bu paket decorator'ı
  async createSale(dto: CreateSaleDto) {
    // this.transactionContext.manager → KALDIR
    // Direkt repo kullan, plugin context'i yönetir:
    await this.saleRepo.save(sale);
  }
}
```

**Adım 3 – Temizlik:**
- `src/common/decorators/transactional.decorator.ts` → **SİL**
- `TransactionInternal` sınıfını barındıran tüm dosyalar → **SİL**
- Tüm servislerde `this.transactionContext.manager.save(...)` → `this.repo.save(...)` olarak değiştir

---

## BÖLÜM 2 — FİNANSAL BÜTÜNLÜK & İŞ MANTIĞI

---

### [TASK-004] Kuruş Farkı Dağıtımı (Penny Rounding)

**Sorun:** Satır bazlı KDV toplamı ile belge toplam KDV'si arasındaki yuvarlama farkları e-fatura sistemlerinde red gerekçesi olur.

```typescript
// sales/sales.service.ts  — calculateLineKdvs() metodu içinde

let sumOfLineKdvs = new Decimal(0);
let maxLineIndex  = 0;
let maxLineAmount = new Decimal(0);

saleItems.forEach((item, index) => {
  const lineKdv = FH.calculateKdv(item.lineMatrah, Number(item.kdvRate));
  item.kdvAmount = lineKdv;
  sumOfLineKdvs  = sumOfLineKdvs.add(lineKdv);

  if (item.lineMatrah.gt(maxLineAmount)) {
    maxLineAmount = item.lineMatrah;
    maxLineIndex  = index;
  }
});

// Olması gereken toplam KDV
const expectedKdv  = FH.calculateKdv(discountedMatrah, avgKdvRate);
const difference   = expectedKdv.sub(sumOfLineKdvs);

// Farkı en büyük tutarlı kaleme ekle (ISO 4217 "largest remainder" yöntemi)
if (!difference.isZero()) {
  saleItems[maxLineIndex].kdvAmount =
    saleItems[maxLineIndex].kdvAmount.add(difference);
}
```

> Neden en büyük kaleme? Orantısal hata en küçük olur, ticari kabul görür.

---

### [TASK-005] Cascading Soft Delete Guard

**Sorun:** Cari silinirken yalnızca bakiye kontrolü yapılıyor; aktif sipariş/sevkiyat bağlantısı koparılınca veri bütünlüğü bozulur.

```typescript
// parties/parties.service.ts — softDelete() içinde

async softDelete(id: string): Promise<void> {
  // 1. Bakiye kontrolü
  const party = await this.partyRepo.findOneOrFail({ where: { id } });
  if (party.balance.gt(0)) {
    throw new BadRequestException('Açık bakiyesi olan cari silinemez.');
  }

  // 2. İlişkisel bütünlük — aktif siparişler
  const activeOrderCount = await this.dataSource
    .getRepository(Sale)
    .count({
      where: {
        partyId: id,
        status: In(['draft', 'approved', 'shipped']),
      },
    });

  if (activeOrderCount > 0) {
    throw new BadRequestException(
      `Bu cariye ait ${activeOrderCount} adet aktif sipariş mevcut. Önce siparişleri tamamlayın veya iptal edin.`,
    );
  }

  // 3. Soft delete
  await this.partyRepo.softDelete(id);
}
```

---

### [TASK-006] Decimal Payload Standartı (parseTurkishDecimal)

**Sorun:** `1,000,000.50` (Amerikan formatı) girildiğinde mevcut regex her `.` siler, `,` → `.` çevirir → sonuç `100000050` (100 Milyon) olur.

**Çözüm — Kesin format tespiti ile güvenli parse:**
```typescript
// common/helpers/number.helper.ts

/**
 * Türkçe VEYA Amerikan formatlı sayı string'ini
 * "1234567.89" biçiminde döndürür (parseFloat KULLANILMAZ).
 * Geçersiz girişte null döner — caller exception fırlatmalı.
 */
export function parseTurkishDecimal(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  // 1. Boşluk ve para birimi sembollerini temizle
  let s = input.replace(/[\s₺$€£]/g, '');

  const commaCount = (s.match(/,/g) ?? []).length;
  const dotCount   = (s.match(/\./g) ?? []).length;

  // 2. Format tespiti
  if (commaCount === 0 && dotCount === 0) {
    // Düz tam sayı: "1000"
    return s;
  }

  if (commaCount === 0 && dotCount === 1) {
    // Amerikan ondalık: "1000.50"
    return s;
  }

  if (dotCount === 0 && commaCount === 1) {
    // Türkçe ondalık: "1000,50"
    return s.replace(',', '.');
  }

  // 3. Binlik ayıraç + ondalık
  // Türkçe format: "1.000.000,50" → son ayıraç ','
  if (s.endsWith(/,\d{1,2}$/.exec(s)?.[0] ?? '')) {
    const lastCommaIdx = s.lastIndexOf(',');
    const intPart = s.slice(0, lastCommaIdx).replace(/\./g, '');
    const decPart = s.slice(lastCommaIdx + 1);
    if (!/^\d+$/.test(intPart) || !/^\d+$/.test(decPart)) return null;
    return `${intPart}.${decPart}`;
  }

  // Amerikan format: "1,000,000.50" → son ayıraç '.'
  if (s.endsWith(/\.\d{1,2}$/.exec(s)?.[0] ?? '')) {
    const lastDotIdx = s.lastIndexOf('.');
    const intPart = s.slice(0, lastDotIdx).replace(/,/g, '');
    const decPart = s.slice(lastDotIdx + 1);
    if (!/^\d+$/.test(intPart) || !/^\d+$/.test(decPart)) return null;
    return `${intPart}.${decPart}`;
  }

  return null; // Tanımsız format
}
```

**Kullanım (backend controller/service):**
```typescript
const rawPrice = dto.unitPrice; // "1.250,99"
const parsed   = parseTurkishDecimal(rawPrice);
if (parsed === null) throw new BadRequestException('Geçersiz fiyat formatı');
const price = new Decimal(parsed); // Decimal("1250.99") ✓
```

---

## BÖLÜM 3 — ROL VE YETKİ (RBAC) MİMARİSİ

---

### [TASK-007] Regex Yetki Kontrolünün Kaldırılması

**Sorun:** `p.key.includes('view')` regex ile yetki tespiti; yeni modül eklendiğinde kod değişikliği gerektirir ve typo'ya karşı kırılgandır.

**Adım 1 – Migration:**
```sql
-- migrations/XXXX_add_action_to_permissions.sql
ALTER TABLE permissions
  ADD COLUMN action VARCHAR(20) NOT NULL DEFAULT 'read'
  CHECK (action IN ('read', 'write', 'delete', 'approve', 'export'));
```

```typescript
// typeorm migration örneği
export class AddActionToPermissions implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE permissions
      ADD COLUMN action VARCHAR(20) NOT NULL DEFAULT 'read'
    `);
    // Mevcut key adlarından tahmin et (tek seferlik veri taşıma)
    await queryRunner.query(`
      UPDATE permissions SET action = 'read'
      WHERE key LIKE '%view%' OR key LIKE '%list%' OR key LIKE '%get%'
    `);
    await queryRunner.query(`
      UPDATE permissions SET action = 'write'
      WHERE key LIKE '%create%' OR key LIKE '%update%' OR key LIKE '%edit%'
    `);
    await queryRunner.query(`
      UPDATE permissions SET action = 'delete' WHERE key LIKE '%delete%'
    `);
    await queryRunner.query(`
      UPDATE permissions SET action = 'approve' WHERE key LIKE '%approve%'
    `);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE permissions DROP COLUMN action`);
  }
}
```

**Adım 2 – Entity güncelleme:**
```typescript
// permissions/permission.entity.ts
@Entity('permissions')
export class Permission {
  @Column({ type: 'varchar', length: 20, default: 'read' })
  action: 'read' | 'write' | 'delete' | 'approve' | 'export';
}
```

**Adım 3 – Frontend (RolesPage.tsx):**
```tsx
// ESKİ — SİL:
const readPerms = permissions.filter(p => p.key.includes('view'));

// YENİ:
const readPerms = permissions.filter(p => p.action === 'read');
const writePerms = permissions.filter(p => p.action === 'write');
const deletePerms = permissions.filter(p => p.action === 'delete');
```

---

## BÖLÜM 4 — FRONTEND PERFORMANS & STABİLİTE

---

### [TASK-008] Form Verisi Kaybını Önleme

**Sorun:** Kullanıcı sekmeyi kapattığında veya tarayıcı çöktüğünde Zustand store senkron flush yapılmadığı için form verisi kaybolur.

```typescript
// hooks/usePersistentForm.ts

export function usePersistentForm(saveToStorageSync: () => void) {
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveToStorageSync(); // localStorage'a senkron yaz
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveToStorageSync(); // Component unmount'ta da kaydet
    };
  }, [saveToStorageSync]);
}
```

```typescript
// stores/useSalesWizardStore.ts (zustand persist ile birlikte)
import { persist, createJSONStorage } from 'zustand/middleware';

export const useSalesWizardStore = create(
  persist(
    (set, get) => ({
      formData: {},
      saveToStorageSync: () => {
        // Zustand persist zaten localStorage'ı yönetir
        // Manuel flush için:
        const state = get();
        localStorage.setItem(
          'sales-wizard-store',
          JSON.stringify({ state, version: 1 }),
        );
      },
    }),
    {
      name: 'sales-wizard-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
```

---

### [TASK-009] React Gereksiz Re-render Önleme (useCallback)

**Sorun:** `DataTable` prop'larına inline arrow function geçmek, `React.memo` optimizasyonunu etkisiz kılar.

```tsx
// pages/SalesPage.tsx

// ❌ ESKİ — Her render'da yeni referans üretir:
<DataTable
  onArchive={s => s.status === 'draft' ? handleCancel(s.id) : undefined}
  onEdit={row => openEditModal(row.id)}
/>

// ✅ YENİ — Stabil referanslar:
const onArchiveAction = useCallback(
  (row: Sale) => {
    if (row.status === 'draft') handleCancel(row.id);
  },
  [handleCancel],
);

const onEditAction = useCallback(
  (row: Sale) => openEditModal(row.id),
  [openEditModal],
);

<DataTable
  onArchive={onArchiveAction}
  onEdit={onEditAction}
/>
```

> Aynı pattern tüm listeleme sayfalarına (PurchasesPage, ItemsPage, PartiesPage, vb.) uygulanmalıdır.

---

### [TASK-010] Z-Index Hiyerarşisi Standardizasyonu

**Sorun:** Kod içinde `z-[100]`, `z-[999]`, `z-[1000]`, `z-[9999]` gibi arbitrary değerler çakışmalara yol açıyor.

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      zIndex: {
        'dropdown': '30',
        'header':   '40',
        'modal':    '50',
        'toast':    '60',
        'tooltip':  '70',
        'loader':   '9999',
      },
    },
  },
};
```

**Temizlik:**
```bash
# Proje genelinde arbitrary z-index tara:
grep -rn "z-\[" src/
```
Bulunan her `z-[X]` değerini yukarıdaki semantic token'larla değiştir.

---

## BÖLÜM 5 — EŞ ZAMANLILIK & RACE CONDITION

---

### [TASK-011] Sequence Generator Race Condition

**Sorun:** İki eş zamanlı istek aynı `itemCodeGroupId` için sequence bulamayınca ikisi birden INSERT yapar; biri `catch (e) {}` bloğuna düşer, pes eder ve `sequence!.currentNumber` null reference exception fırlatır.

**Çözüm — Atomik Upsert + DB seviyesi increment:**

```typescript
// items/sequence-generator.service.ts

async generateNextCode(
  manager: EntityManager,
  itemCodeGroupId: string,
  prefix: string,
): Promise<string> {

  // 1. Atomik INSERT ... ON DUPLICATE KEY UPDATE
  await manager.query(
    `INSERT INTO item_code_sequences (item_code_group_id, current_number)
     VALUES (?, 1)
     ON DUPLICATE KEY UPDATE current_number = current_number + 1`,
    [itemCodeGroupId],
  );

  // 2. Güncel değeri oku (aynı transaction içinde)
  const [row] = await manager.query(
    `SELECT current_number FROM item_code_sequences
     WHERE item_code_group_id = ?`,
    [itemCodeGroupId],
  );

  const seq    = (row as { current_number: number }).current_number;
  const padded = String(seq).padStart(3, '0');
  return `${prefix}-${padded}`;
}
```

> Bu yaklaşım race condition'ı tamamen ortadan kaldırır: DB motoru increment'i tek operasyonda atomik yapar, uygulama katmanında lock veya retry gerekmez.

---

## BÖLÜM 6 — MİMARİ DÖNGÜSEL BAĞIMLILIK

---

### [TASK-012] Circular Dependency — InventoryOrchestratorService

**Sorun:** `ItemsService.softDelete()` içinde `dynamic import` + runtime entity resolution hack'i ile `StocksService`'e erişiliyor. Bu NestJS DI sistemini devre dışı bırakır ve unit test yazmayı imkânsız kılar.

**Çözüm — Orchestrator Pattern:**

```typescript
// inventory/inventory-orchestrator.service.ts
@Injectable()
export class InventoryOrchestratorService {
  constructor(
    private readonly itemsRepo: Repository<Item>,
    private readonly stocksRepo: Repository<Stock>,
  ) {}

  async softDeleteItem(id: string): Promise<void> {
    // Stok kontrolü (artık circular dep yok)
    const totalStock = await this.stocksRepo
      .createQueryBuilder('s')
      .select('SUM(s.quantity)', 'total')
      .where('s.itemId = :id', { id })
      .getRawOne<{ total: string }>();

    if (Number(totalStock?.total ?? 0) > 0) {
      throw new BadRequestException(
        'Stok miktarı sıfır olmayan ürün silinemez.',
      );
    }

    await this.itemsRepo.softDelete(id);
  }
}
```

```typescript
// items/items.service.ts  — eski dynamic import bloğunu SİL
// Artık ItemsService sadece kendi repo'suyla çalışır.
// softDeleteItem() çağrısı controller'dan InventoryOrchestratorService'e yönlendirilir.
```

```typescript
// items/items.controller.ts
@Delete(':id')
softDelete(@Param('id') id: string) {
  return this.inventoryOrchestrator.softDeleteItem(id);
}
```

---

## BÖLÜM 7 — SQL WILDCARD DoS KORUМASI

---

### [TASK-013] LIKE Injection & Wildcard DoS

**Sorun:** `%_____` gibi bir arama metni SQL full-table scan'e zorlar; DB CPU %100'e kilitlenir.

```typescript
// common/utils/sql.helper.ts

/**
 * SQL LIKE sorgularında kullanılan özel karakterleri escape eder.
 * % → \%   _ → \_   \ → \\
 */
export function escapeLike(str: string): string {
  return str.replace(/[\\%_]/g, (char) => `\\${char}`);
}
```

**Tüm servis/repository kullanımlarında:**
```typescript
// logs/logs.service.ts, parties/parties.service.ts, items/items.service.ts, vb.

import { escapeLike } from '../common/utils/sql.helper';

if (query.search) {
  const safe = escapeLike(query.search.trim());
  qb.andWhere(
    '(entity.name LIKE :s OR entity.code LIKE :s)',
    { s: `%${safe}%` },
  );
}
```

> Ek önlem: `query.search` uzunluğunu 100 karakterle sınırla:
```typescript
if (query.search?.length > 100) {
  throw new BadRequestException('Arama terimi çok uzun.');
}
```

---

## BÖLÜM 8 — TYPEORM PAGINATION + JOIN SORUNU

---

### [TASK-014] ManyToMany İlişkide Pagination (OutOfMemory Çözümü)

**Sorun:** `leftJoinAndSelect` + `skip/take` kombinasyonu TypeORM'u tüm veriyi RAM'e çekip JS tarafında paginate etmeye zorlar.

```typescript
// roles/roles.service.ts

async findAll(query: PaginationDto) {
  // Adım 1: Sadece ID'leri paginate et (join yok)
  const [rawRoles, total] = await this.roleRepo.findAndCount({
    skip:  query.skip,
    take:  query.limit,
    order: { createdAt: 'DESC' },
    // relations: ['permissions'] — BURAYA YAZMA
  });

  if (rawRoles.length === 0) return { data: [], total };

  // Adım 2: Bulunan ID'lere göre ilişkileri ayrı sorguda getir
  const rolesWithPerms = await this.roleRepo.find({
    where:     { id: In(rawRoles.map((r) => r.id)) },
    relations: ['permissions'],
    order:     { createdAt: 'DESC' },
  });

  return { data: rolesWithPerms, total };
}
```

> Aynı pattern `UsersService`, `MenuService` ve `OneToMany/ManyToMany` içeren tüm listeleme sorgularına uygulanmalıdır.

---

## BÖLÜM 9 — CORS GÜVENLİĞİ

---

### [TASK-015] Hardcoded CORS → Environment Variable

**Sorun:** Localhost tabanlı hardcoded origin listesi, production deploy'da tüm frontend erişimini engeller.

```typescript
// main.ts

const allowedOrigins: string[] = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173']; // Yalnızca dev fallback

app.enableCors({
  origin:         allowedOrigins,
  credentials:    true,
  methods:        ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-TOKEN'],
  exposedHeaders: ['X-CSRF-TOKEN'],
});
```

```env
# .env.production
ALLOWED_ORIGINS=https://erp.ermay.com,https://app.ermay.com

# .env.development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5143
```

> ⚠️ `credentials: true` iken `origin: '*'` YAPAMAZSIN — tarayıcı reddeder ve her şey patlar.

---

## BÖLÜM 10 — ZUSTAND ANTI-PATTERN

---

### [TASK-016] Zustand + React Router Anti-Pattern

**Sorun:** `AuthNavigationBridge` componenti `navigate` hook'unu Zustand store'a inject ediyor. Component unmount olduğunda closure stale kalır; logout çağrısı hiçbir şey yapmaz.

**Çözüm — API Interceptor ile yönlendirme:**

```typescript
// api/axios.config.ts

import axios from 'axios';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Store veya hook kullanma — direkt window.location
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
```

```typescript
// App.tsx — AuthNavigationBridge componentini TAMAMEN SİL
// store/useAuthStore.ts — setRedirectToLogin fonksiyonunu SİL
```

---

## BÖLÜM 11 — TIMEZONE YÖNETİMİ

---

### [TASK-017] Saat Dilimi Yönetimi (Finansal Tarih Sapması)

**Sorun:** Backend sunucusu UTC timezone'undayken Türkiye'den gönderilen tarihler 3 saat kayarak bir önceki/sonraki güne düşebilir.

**Kural: Frontend ISO string gönderir, Backend sadece UTC'ye kaydeder.**

```typescript
// Frontend — tarih seçici komponenti

// ❌ ESKİ (backend timezone'una güvenir):
const date = new Date(selectedDate);

// ✅ YENİ (tarayıcı timezone'unda ISO string üretir):
const date = new Date(selectedDate);
const isoDate = date.toLocaleDateString('sv-SE'); // "2024-03-15" formatı — timezone-safe
// Veya:
const isoWithTime = date.toISOString(); // UTC ISO string
```

```typescript
// Backend — date.utils.ts

export const DateUtils = {
  /**
   * Frontend'den gelen "YYYY-MM-DD" string'ini
   * UTC gün başlangıcına çevirir.
   * Backend sunucusunun timezone'undan BAĞIMSIZDIR.
   */
  parseLocalDate: (dateStr: string): Date => {
    // "2024-03-15" → UTC 2024-03-15T00:00:00Z
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  },

  toISODate: (date: Date): string => {
    return date.toISOString().split('T')[0];
  },
};
```

```typescript
// DB Entity — tarih kolonları
@Entity('sales')
export class Sale {
  @Column({ type: 'date' })  // Saat bilgisi yok, sadece gün
  saleDate: string;           // "2024-03-15" — string olarak sakla

  @CreateDateColumn({ type: 'timestamptz' }) // Audit için full UTC timestamp
  createdAt: Date;
}
```

---

## BÖLÜM 12 — REACT KEY ANTI-PATTERN

---

### [TASK-018] DataTable key={index} Kullanımı

**Sorun:** Dinamik sütunlarda array index key kullanımı React reconciler'ını yanıltır; hücre state'leri yanlış satırlara kayar.

```tsx
// components/DataTable.tsx

// ❌ ESKİ:
{columns.map((col, idx) => (
  <th key={idx}>{col.header}</th>
))}

{row.cells.map((cell, idx) => (
  <td key={idx}>{cell.value}</td>
))}

// ✅ YENİ:
{columns.map((col) => (
  <th key={col.accessor.toString()}>{col.header}</th>
))}

{row.cells.map((cell) => (
  <td key={`${row.id}-${cell.columnId}`}>{cell.value}</td>
))}
```

> `col.accessor` string veya function olabilir; `.toString()` her durumu kapsar.  
> Satır hücrelerinde `row.id` + `columnId` bileşik key kullan — uniqueness garantili.

---

## KONTROL LİSTESİ — GÜVENLİK AYARI

Canlıya almadan önce her maddeyi ✅ işaretle:

| Kontrol | Durum |
|---------|-------|
| `RABBITMQ_URL` env variable set edildi | ☐ |
| `ALLOWED_ORIGINS` production URL'leri içeriyor | ☐ |
| `DUMMY_HASH` gerçek bcrypt cost:12 hash ile üretildi | ☐ |
| Tüm `z-[X]` arbitrary değerler kaldırıldı | ☐ |
| `escapeLike` tüm LIKE sorgularına uygulandı | ☐ |
| `key={idx}` tüm list render'larından kaldırıldı | ☐ |
| `AuthNavigationBridge` component silindi | ☐ |
| `transactional.decorator.ts` silindi | ☐ |
| Migration çalıştırıldı (`action` kolonu eklendi) | ☐ |
| Sequence Generator eski catch bloğu silindi | ☐ |
| Dynamic import hack (items.service.ts) silindi | ☐ |
| Penny rounding tüm fatura akışlarında test edildi | ☐ |