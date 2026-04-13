# ERP Projesi — Final Stabilizasyon ve Refactor Planı

> **Versiyon:** v2.0 — Final  
> **Tarih:** Nisan 2026  
> **Kapsam:** NestJS Backend + React Frontend + TypeORM  
> **Öncelik Sırası:** 🔴 Kritik → 🟠 Yüksek → 🟡 Orta → 🟢 İyileştirme

---

> ⚠️ **KURAL:** Bu listedeki 🔴 maddeler tamamlanmadan yeni feature geliştirme başlatılmamalıdır.

---

## 🔴 KRİTİK — Üretimde Hemen Patlayacak Sorunlar

---

### 1. TypeScript "AnyScript" Temizliği

**Sorun:** `useState<any[]>`, `catch (err: any)`, `const payload: any` — TypeScript'in tip güvencesi tamamen devre dışı bırakılmış. Compile-time hataları yakalanmıyor, runtime crash riski yüksek.

**Çözüm — `src/types/index.ts` oluştur:**

```typescript
export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  balance: string; // decimal → string olarak tut
}

export interface SaleItem {
  itemId: number;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: string;
  taxRate: number;
}

export interface CartItem extends SaleItem {
  lineTotal: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
```

**`catch` bloklarını düzelt:**

```typescript
// ❌ Yanlış
catch (err: any) { console.error(err.message); }

// ✅ Doğru
catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Bilinmeyen hata oluştu';
  toast.error(message);
}
```

**`payload` manipülasyonunu temizle:**

```typescript
// ❌ Yanlış
const payload: any = { ...formData };
delete payload.selectedRoles;

// ✅ Doğru
const { selectedRoles, ...payload } = formData;
// veya tip ile:
type CreateUserPayload = Omit<typeof formData, 'selectedRoles'>;
const typedPayload: CreateUserPayload = { ...payload };
```

**`useState` tiplemelerini düzelt:**

```typescript
// ❌
const [cart, setCart] = useState<any[]>([]);

// ✅
const [cart, setCart] = useState<CartItem[]>([]);
```

---

### 2. JWT LocalStorage — XSS Güvenlik Açığı

**Sorun:** `localStorage.setItem('erp_token', token)` — Herhangi bir XSS açığı tüm token'ları ifşa eder.

**Backend değişikliği (NestJS):**

```typescript
// auth.controller.ts
@Post('login')
async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
  const { accessToken } = await this.authService.login(dto);
  res.cookie('erp_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000 // 8 saat
  });
  return { message: 'Giriş başarılı' };
}

@Post('logout')
async logout(@Res({ passthrough: true }) res: Response) {
  res.clearCookie('erp_token');
  return { message: 'Çıkış başarılı' };
}
```

**Frontend değişikliği:**

```typescript
// axios instance — token header'a eklemeyi bırak, cookie otomatik gider
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true // ← Bu yeter
});
// Tüm localStorage.setItem / getItem çağrılarını sil
```

---

### 3. Brute Force — Login Koruması Yok

**Sorun:** Login endpoint'i yalnızca genel throttle ile korunuyor; bot saatte 1800+ şifre deneyebilir.

**Çözüm:**

```typescript
// auth.controller.ts
@Throttle({ default: { limit: 5, ttl: 60000 } }) // dakikada max 5 istek
@Post('login')
async login(@Body() dto: LoginDto) { ... }
```

```typescript
// auth.service.ts — hesap kilitleme mantığı
async login(dto: LoginDto) {
  const user = await this.userRepo.findOne({ where: { email: dto.email } });

  if (user?.state === 2) {
    throw new UnauthorizedException('Hesap kilitli. Yöneticinizle iletişime geçin.');
  }

  const isValid = await bcrypt.compare(dto.password, user?.password ?? '');

  if (!isValid) {
    if (user) {
      user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1;
      if (user.failedLoginAttempts >= 3) {
        user.state = 2; // Kilitli
      }
      await this.userRepo.save(user);
    }
    throw new UnauthorizedException('E-posta veya şifre hatalı');
  }

  user.failedLoginAttempts = 0;
  await this.userRepo.save(user);
  return this.generateToken(user);
}
```

---

### 4. Race Condition — Stok Düşme Hatası

**Sorun:** `SalesService.approveSale` içinde eş zamanlı iki onay işlemi aynı stoğu okuyup yanlış miktara güncelleyebilir. Stok eksiye düşer.

**Etkilenen dosya:** `SalesService.ts`

```typescript
// ❌ Yanlış — Race condition riski
const stock = await queryRunner.manager.findOne(Stock, { where: { ... } });
await queryRunner.manager.update(Stock, stock.id, { quantity: stock.quantity - qty });

// ✅ Doğru — Pessimistic Write Lock
const stock = await queryRunner.manager.findOne(Stock, {
  where: { itemId: saleItem.itemId, warehouseId },
  lock: { mode: 'pessimistic_write' }
});
if (stock.quantity < saleItem.quantity) {
  throw new BadRequestException(`Yetersiz stok: ${saleItem.itemCode}`);
}
await queryRunner.manager.update(Stock, stock.id, {
  quantity: () => `quantity - ${saleItem.quantity}`
});
```

---

### 5. Race Condition — Sequence Üretimi (Raw SQL)

**Sorun:** `SequenceGeneratorService` içinde hardcode tablo adıyla raw SQL kullanılıyor. Entity adı değişirse derleyici uyarmaz, lock mekanizması eksik.

```typescript
// ❌ Yanlış
const sequences = await queryRunner.query(
  `SELECT id, current_number FROM item_code_sequences WHERE item_code_group_id = ? FOR UPDATE`,
  [itemCodeGroupId]
);

// ✅ Doğru
const sequence = await queryRunner.manager
  .createQueryBuilder(ItemCodeSequence, 'seq')
  .setLock('pessimistic_write')
  .where('seq.itemCodeGroupId = :id', { id: itemCodeGroupId })
  .getOne();
```

---

### 6. Soft Delete + Unique Constraint Çakışması

**Sorun:** Silinmiş (`deleted_at` dolu) kayıtlar unique index'i bloke eder. `MOB-001` kodlu ürün silinse bile aynı kodu yeni bir ürüne veremezsin.

**Çözüm — Partial Index (MySQL 8+):**

```typescript
// Item entity
@Index("UQ_ITEM_CODE_ACTIVE", ["code"], {
  where: "deleted_at IS NULL",
  unique: true
})
@Entity()
export class Item extends SoftDeleteEntity {
  @Column()
  code: string;
}
```

`@Unique(['code'])` kısıtlamasını entity'den kaldır, yerine yukarıdaki partial index gelecek.

---

### 7. Para Hesaplamalarında Float Hatası

**Sorun:** `0.1 + 0.2 = 0.30000000000000004` — JavaScript float aritmetiği KDV ve toplam hesaplarında kuruş kaymasına yol açar.

**Kurulum:**

```bash
npm install decimal.js
```

**Kullanım:**

```typescript
import { Decimal } from 'decimal.js';

// ❌ Yanlış
const total = quantity * unitPrice * (1 + taxRate / 100);

// ✅ Doğru
const total = new Decimal(quantity)
  .mul(unitPrice)
  .mul(new Decimal(1).plus(new Decimal(taxRate).div(100)))
  .toDecimalPlaces(2)
  .toString();
```

Veritabanında `DECIMAL(15,4)` kullan. Tüm para değerlerini backend'de `string` olarak al, `Decimal` ile işle, `string` olarak kaydet.

---

### 8. Sessiz Hatalar — Kullanıcıya Hiçbir Bilgi Verilmiyor

**Sorun:** `catch (error) { console.error(error); }` — Kullanıcı kaydetmenin başarılı olup olmadığını bilemiyor. Loading state kapanmıyor, butonlar kilitli kalıyor.

**Çözüm — Tüm catch bloklarını güncelle:**

```typescript
// ❌ Yanlış
try {
  await bomsAPI.create(payload);
} catch (error) {
  console.error(error);
}

// ✅ Doğru
const [loading, setLoading] = useState(false);

const handleSave = async () => {
  setLoading(true);
  try {
    await bomsAPI.create(payload);
    toast.success('Reçete başarıyla oluşturuldu');
    onSuccess?.();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kayıt sırasında hata oluştu';
    toast.error(msg);
  } finally {
    setLoading(false); // Her zaman kapat
  }
};
```

---

### 9. Mass Assignment Zafiyeti

**Sorun:** `Object.assign(user, dto)` ile frontend'den gelen veriler doğrudan entity'e basılıyor. `role_id`, `tenant_id` gibi hassas alanlar manipüle edilebilir.

```typescript
// ❌ Tehlikeli
Object.assign(user, otherData);

// ✅ Açık mapping
user.name = dto.name;
user.email = dto.email;
user.phone = dto.phone;
// Sadece izin verilen alanlar — başka hiçbir şey
```

`ValidationPipe`'da `whitelist: true` + `forbidNonWhitelisted: true` kombinasyonu zorunlu.

---

## 🟠 YÜKSEK — İş Mantığı ve Veri Bütünlüğü

---

### 10. Tarih/Zaman Yönetimi — Timezone Bug

**Sorun:** `d.toISOString().split('T')[0]` UTC/yerel saat karışıklığı yaratır. Gece yarısı civarında fatura tarihi bir gün kayar.

**Kurulum:** `dayjs` zaten kuruluysa, `timezone` plugin'ini aktif et:

```bash
npm install dayjs
```

```typescript
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

// ❌ Yanlış
const getLocalDateString = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

// ✅ Doğru
const getTodayString = () => dayjs().tz('Europe/Istanbul').format('YYYY-MM-DD');
```

Projedeki tüm `new Date()` + split kullanımlarını `dayjs` ile değiştir.

---

### 11. Dashboard — COUNT Bombardımanı

**Sorun:** Her dashboard açılışında 6+ ağır `COUNT(*)` sorgusu çalışıyor. 10 eş zamanlı kullanıcı = 60 sorgu.

**Çözüm — Cache katmanı:**

```typescript
// dashboard.service.ts
@Injectable()
export class DashboardService {
  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async getStats() {
    const CACHE_KEY = 'dashboard:stats';
    const TTL = 300; // 5 dakika

    const cached = await this.cache.get(CACHE_KEY);
    if (cached) return cached;

    const [userCount, partyCount, itemCount, saleCount] = await Promise.all([
      this.userRepo.count(),
      this.partyRepo.count(),
      this.itemRepo.count(),
      this.saleRepo.count({ where: { status: 'approved' } }),
    ]);

    const stats = { userCount, partyCount, itemCount, saleCount, cachedAt: new Date() };
    await this.cache.set(CACHE_KEY, stats, TTL);
    return stats;
  }
}
```

Redis yoksa başlangıçta `cache-manager` in-memory ile de çalışır.

---

### 12. BOM Versiyonlama Yok

**Sorun:** BOM güncellenince geçmiş üretim emirlerinin maliyeti ve reçetesi tutarsızlaşır.

**Çözüm — Entity'e version ekle:**

```typescript
@Entity()
export class Bom {
  @Column({ default: 1 })
  version: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Item)
  product: Item;
}

// Service — güncelleme yerine yeni versiyon oluştur
async updateBom(id: number, dto: UpdateBomDto) {
  const current = await this.bomRepo.findOne({ where: { id } });
  await this.bomRepo.update(id, { isActive: false }); // Eskiyi pasife çek

  return this.bomRepo.save({
    ...dto,
    product: current.product,
    version: current.version + 1,
    isActive: true
  });
}
```

```typescript
// ProductionOrder — spesifik BOM versiyonuna kilitle
@Entity()
export class ProductionOrder {
  @ManyToOne(() => Bom)
  bom: Bom; // bomId + version snapshot alınmalı

  @Column()
  bomVersion: number; // Üretim emri oluşturulduğundaki versiyon
}
```

---

### 13. Manuel Stok Fişinin Finansal Karşılığı Yok

**Sorun:** "Sayım Eksiği" kaydedildiğinde depodaki sayı azalıyor ama gider kalemi oluşmuyor. Muhasebe tutarsız.

```typescript
// stocks.service.ts
async createManualAdjustment(dto: ManualAdjustmentDto, queryRunner: QueryRunner) {
  const item = await queryRunner.manager.findOne(Item, { where: { id: dto.itemId } });
  const costValue = new Decimal(Math.abs(dto.quantity))
    .mul(item.purchasePrice)
    .toString();

  // Stok hareketi
  await queryRunner.manager.save(StockMovement, {
    itemId: dto.itemId,
    quantity: dto.quantity,
    referenceType: 'manual_adjustment',
    unitCost: item.purchasePrice
  });

  // Finansal karşılık — otomatik oluştur
  const isLoss = dto.quantity < 0;
  await queryRunner.manager.save(Transaction, {
    type: isLoss ? 'expense' : 'income',
    description: isLoss
      ? `Stok Fire Gideri — ${item.name}`
      : `Sayım Fazlası Geliri — ${item.name}`,
    amount: costValue,
    referenceType: 'stock_adjustment'
  });
}
```

---

### 14. Hardcoded Rol Adı Kontrolü

**Sorun:** `roleNames.includes('admin')` — Rol adı değişirse tüm yöneticiler yetkisini kaybeder.

```typescript
// ❌ Kırılgan
if (roleNames.includes('admin')) { ... }

// ✅ Dayanıklı — Role entity'ye ekle
@Column({ default: false })
isSystemAdmin: boolean;

// Guard'da
const isAdmin = user.roles.some((r) => r.isSystemAdmin);
```

---

### 15. Hardcoded KDV Oranları

**Sorun:** `[0, 1, 10, 20]` koda gömülü. Mevzuat değişince kod düzenlenmek zorunda kalınıyor.

```typescript
@Entity('tax_rates')
export class TaxRate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // "KDV %20"

  @Column('decimal', { precision: 5, scale: 2 })
  rate: string; // "20.00"

  @Column({ default: true })
  isActive: boolean;
}

// Controller
@Get('tax-rates')
findAll() {
  return this.taxRateRepo.find({ where: { isActive: true } });
}
```

Frontend'deki hardcode array'i bu API endpoint'inden besle.

---

### 16. Hassas Veri Loglaması — KVKK/GDPR İhlali

**Sorun:** TCKN, IBAN, vergi numarası gibi kişisel veriler düz metin olarak log'a düşüyor.

```typescript
// logs.interceptor.ts
const SENSITIVE_FIELDS = [
  'password', 'token', 'iban', 'tckn', 'tc_no',
  'taxNumber', 'tax_number', 'creditCard', 'cvv'
];

function sanitizeBody(obj: Record<string, unknown>) {
  const clean = { ...obj };
  for (const field of SENSITIVE_FIELDS) {
    if (field in clean) clean[field] = '***MASKED***';
  }
  return clean;
}
```

---

## 🟡 ORTA — Performans ve Frontend Mimarisi

---

### 17. Frontend'de `limit: 1000` ile Sahte Pagination

**Sorun:** 5.000 cari veya 10.000 ürün çekildiğinde tarayıcı donar. Arama client-side yapılıyor.

**Backend'e server-side pagination ekle:**

```typescript
// parties.controller.ts
@Get()
findAll(
  @Query('page') page = 1,
  @Query('limit') limit = 20,
  @Query('search') search?: string,
  @Query('sortBy') sortBy = 'name',
  @Query('order') order: 'ASC' | 'DESC' = 'ASC'
) {
  return this.partiesService.findAll({ page: +page, limit: +limit, search, sortBy, order });
}
```

**Frontend'de React Query + debounce:**

```bash
npm install @tanstack/react-query
```

```typescript
// hooks/useParties.ts
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function useParties(search: string, page: number) {
  const debouncedSearch = useDebounce(search, 300);
  return useQuery({
    queryKey: ['parties', debouncedSearch, page],
    queryFn: () => partiesAPI.findAll({ search: debouncedSearch, page, limit: 20 }),
    staleTime: 1000 * 60, // 1 dakika cache
  });
}
```

---

### 18. Frontend API İstek Yarışı (Race Condition)

**Sorun:** Hızlı arama yapılırsa geç dönen eski istek yeni sonucun üzerine yazar.

```typescript
useEffect(() => {
  const controller = new AbortController();

  const fetchData = async () => {
    try {
      const result = await api.get('/parties', {
        params: { search },
        signal: controller.signal
      });
      setParties(result.data);
    } catch (err) {
      if (axios.isCancel(err)) return; // İptal edilen istek — sessizce geç
      toast.error('Veri yüklenemedi');
    }
  };

  fetchData();
  return () => controller.abort(); // Yeni istek gelince eskiyi iptal et
}, [search]);
```

React Query kullanılıyorsa bu otomatik olarak yönetilir.

---

### 19. Devasa Component Dosyaları

**Sorun:** `SalesPage.tsx`, `ProductionPage.tsx` gibi dosyalar 500+ satır. Her şey tek dosyada, bakım imkansız.

**Hedef yapı:**

```
src/pages/Sales/
├── SalesPage.tsx           ← Sadece layout + state koordinasyonu
├── components/
│   ├── CustomerSelect.tsx
│   ├── CartTable.tsx
│   ├── PaymentSummary.tsx
│   └── ApproveSaleModal.tsx
└── hooks/
    └── useSalesForm.ts     ← Form state + submit mantığı
```

500+ satırlık tüm sayfalar bu pattern'a göre parçalanmalı.

---

### 20. Inline CSS Karmaşası

**Sorun:** `style={{ height: '40px' }}` gibi inline CSS'ler maintainability'yi öldürüyor, reusability yok.

**Seçenek A — Tailwind CSS (tavsiye edilir):**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

```tsx
// ❌
<input style={{ height: '40px', fontSize: '12px' }} />

// ✅
<input className="h-10 text-sm border rounded px-2" />
```

**Seçenek B — CSS Modules (sıfır kurulum):**

```tsx
// SalesPage.module.css
.grid { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }

// SalesPage.tsx
import styles from './SalesPage.module.css';
<div className={styles.grid}>
```

---

### 21. Global Loader Anti-Pattern

**Sorun:** `window.dispatchEvent(new CustomEvent('show-loader'))` React mimarisine aykırı. Test edilemiyor, debug'u zor.

**Çözüm — Zustand ile:**

```typescript
// store/uiStore.ts
import { create } from 'zustand';

interface UIStore {
  isLoading: boolean;
  setLoading: (val: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isLoading: false,
  setLoading: (val) => set({ isLoading: val })
}));

// axios interceptor
api.interceptors.request.use((config) => {
  useUIStore.getState().setLoading(true);
  return config;
});
api.interceptors.response.use(
  (res) => { useUIStore.getState().setLoading(false); return res; },
  (err) => { useUIStore.getState().setLoading(false); return Promise.reject(err); }
);
```

---

### 22. React Error Boundary Eksik

**Sorun:** Herhangi bir component crash ettiğinde tüm ekran beyazlaşıyor, kullanıcı bilgi alamıyor.

```tsx
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Component crash:', error, info);
    // Sentry veya benzeri servis varsa buraya ekle
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <h2>Beklenmedik bir hata oluştu</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Tekrar Dene
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// App.tsx
<ErrorBoundary>
  <Router>...</Router>
</ErrorBoundary>
```

---

## 🟢 İYİLEŞTİRME — Kurumsal ERP Gereksinimleri

---

### 23. Çift Taraflı Muhasebe (Double-Entry Bookkeeping)

**Sorun:** `balance = currentBalance + amount` — bakkal defteri mantığı. Paranın izini kaybedersin, denetim yapılamaz.

**Çözüm — Ledger tablosu:**

```typescript
@Entity('ledger_entries')
export class LedgerEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Party)
  party: Party;

  @Column('decimal', { precision: 15, scale: 2 })
  debit: string; // Borç

  @Column('decimal', { precision: 15, scale: 2 })
  credit: string; // Alacak

  @Column()
  description: string;

  @Column({ nullable: true })
  referenceType: string; // 'sale' | 'purchase' | 'payment'

  @Column({ nullable: true })
  referenceId: number;

  @CreateDateColumn()
  createdAt: Date;
}

// Gerçek bakiye = SUM(credit) - SUM(debit)
// Party.balance → sadece cache, periyodik güncellenir
```

Her satış, ödeme ve stok işlemi çift taraflı kayıt üretmeli.

---

### 24. Maliyet (COGS) Hesaplama Eksik

**Sorun:** "Bu ay ne kadar kâr ettik?" sorusuna sistem yanıt veremiyor. Satış maliyeti hesaplanmıyor.

```typescript
@Entity()
export class StockMovement {
  // ...mevcut alanlar...

  @Column('decimal', { precision: 15, scale: 4, nullable: true })
  unitCost: string; // Satış anındaki birim maliyet (FIFO veya Ortalama)

  @Column('decimal', { precision: 15, scale: 4, nullable: true })
  totalCost: string; // unitCost × quantity
}
```

**Algoritma seç ve uygula:**

- **FIFO:** En eski lot'un maliyetini al
- **Moving Average:** `toplam stok değeri / toplam stok adedi`

Satış anında hesaplanıp `StockMovement.unitCost`'a yazılmalı.

---

### 25. İrsaliye ve Kısmi Teslimat (Partial Shipment) Sistemi Eksik

**Sorun:** Sipariş onaylandığı an stokun tamamı düşüyor, fatura kesiliyor. Kısmi teslimat yapılamıyor.

**Doğru akış:**

```
SalesOrder (Sipariş)
  ↓ onaylandı → Stok "Allocated / Reserved" olur
Shipment (İrsaliye) — 1 satışa N irsaliye bağlanabilir
  ↓ sevk edildi → Gerçek stok düşer
Invoice (Fatura) — İrsaliyeye bağlı, sadece sevk edilen miktar faturalanır
```

```typescript
@Entity('shipments')
export class Shipment {
  @ManyToOne(() => Sale)
  sale: Sale;

  @Column({ default: 'draft' }) // draft | shipped | cancelled
  status: string;

  @OneToMany(() => ShipmentItem, (item) => item.shipment, { cascade: true })
  items: ShipmentItem[];

  @Column({ nullable: true })
  shippedAt: Date;
}

@Entity('shipment_items')
export class ShipmentItem {
  @ManyToOne(() => Shipment)
  shipment: Shipment;

  @ManyToOne(() => SaleItem)
  saleItem: SaleItem;

  @Column('decimal', { precision: 15, scale: 4 })
  quantity: string; // Sevk edilen miktar (sipariş miktarından az olabilir)
}
```

---

### 26. Adres Yapısı Normalize Edilmemis

**Sorun:** `address: string` alanında il/ilçe birleşik. Raporlamada LIKE ile arama, performans felaketi.

```typescript
// Party entity — migration gerektirir
@Column({ nullable: true })
city: string; // İl

@Column({ nullable: true })
district: string; // İlçe

@Column({ type: 'text', nullable: true })
addressLine: string; // Açık adres

@Column({ nullable: true })
postalCode: string;

// Fatura ≠ Sevk adresi
@Column({ type: 'text', nullable: true })
billingAddress: string;

@Column({ type: 'text', nullable: true })
shippingAddress: string;
```

---

### 27. Satın Alma (Purchase) Modülü Eksik

**Sorun:** Depoya mal girişi manuel fiş ile yapılıyor. Tedarikçi cari borçlanmıyor, alış fiyatları takip edilemiyor.

**Gerekli tablolar:**

```
PurchaseOrder (Satın Alma Siparişi)
  → PurchaseOrderItem (Kalem)
  → PurchaseReceipt (Mal Kabul / İrsaliye)
    → StockMovement (Stok Giriş)
    → LedgerEntry (Tedarikçi Cari Borç)
```

---

### 28. God Service — Event-Driven Mimari

**Sorun:** `SalesService` her işi kendi yapıyor (stok düş, finans kaydı yaz, bildirim gönder). Tek sorumluluk ilkesi ihlali, test edilemez.

**Çözüm:**

```bash
npm install @nestjs/event-emitter
```

```typescript
// sales.service.ts — sadece satışı onaylar ve event fırlatır
async approveSale(id: number) {
  // ...satış onayı...
  this.eventEmitter.emit('sale.approved', new SaleApprovedEvent(sale));
}

// inventory.listener.ts — kendi işini yapar
@OnEvent('sale.approved')
async handleSaleApproved(event: SaleApprovedEvent) {
  await this.inventoryService.decreaseStock(event.saleItems);
}

// finance.listener.ts — kendi işini yapar
@OnEvent('sale.approved')
async handleSaleApproved(event: SaleApprovedEvent) {
  await this.financeService.createLedgerEntry(event);
}
```

---

## 📊 Öncelik Sırası ve Uygulama Planı

| # | Görev | Tahmini Süre | Öncelik |
|---|-------|-------------|---------|
| 1 | `src/types/index.ts` oluştur, `any` temizle | 1 gün | 🔴 |
| 2 | JWT → HttpOnly Cookie | 4 saat | 🔴 |
| 3 | Login throttle + hesap kilitleme | 3 saat | 🔴 |
| 4 | Stok düşürmeye pessimistic lock | 2 saat | 🔴 |
| 5 | SequenceGenerator → TypeORM QueryBuilder | 2 saat | 🔴 |
| 6 | Soft delete + partial unique index | 1 saat | 🔴 |
| 7 | `decimal.js` ile para hesaplama | 1 gün | 🔴 |
| 8 | Tüm `catch` bloklarına `toast.error` | 4 saat | 🔴 |
| 9 | Mass assignment → explicit mapping | 3 saat | 🔴 |
| 10 | `dayjs.tz` ile tarih yönetimi | 2 saat | 🟠 |
| 11 | Dashboard cache (Redis / in-memory) | 4 saat | 🟠 |
| 12 | BOM versiyonlama | 1 gün | 🟠 |
| 13 | Manuel stok → otomatik finansal kayıt | 4 saat | 🟠 |
| 14 | Hardcoded rol → `isSystemAdmin` flag | 2 saat | 🟠 |
| 15 | KDV oranları → `tax_rates` tablosu | 3 saat | 🟠 |
| 16 | KVKK hassas veri maskeleme | 2 saat | 🟠 |
| 17 | Server-side pagination + React Query | 2 gün | 🟡 |
| 18 | AbortController / istek iptali | 4 saat | 🟡 |
| 19 | Component parçalama (500+ satır dosyalar) | 2 gün | 🟡 |
| 20 | Inline CSS → Tailwind / CSS Modules | 2 gün | 🟡 |
| 21 | Global loader → Zustand + Axios interceptor | 4 saat | 🟡 |
| 22 | Error Boundary ekle | 1 saat | 🟡 |
| 23 | Double-entry Ledger sistemi | 1 hafta | 🟢 |
| 24 | COGS / FIFO maliyet hesaplama | 1 hafta | 🟢 |
| 25 | İrsaliye / Shipment modülü | 1 hafta | 🟢 |
| 26 | Adres yapısı normalize | 3 saat | 🟢 |
| 27 | Satın Alma (Purchase) modülü | 2 hafta | 🟢 |
| 28 | Event-driven mimari (NestJS EventEmitter) | 1 hafta | 🟢 |

---

## 🗓️ Sprint Planı (Önerilen)

### Sprint 1 — Kritik Güvenlik ve Veri Bütünlüğü
- JWT cookie geçişi + login throttle + hesap kilitleme
- Pessimistic lock (stok + sequence)
- `decimal.js` geçişi
- Soft delete partial index
- Mass assignment düzeltme

### Sprint 2 — Tip Güvenliği ve Frontend Sağlığı
- `any` temizliği + `src/types/index.ts`
- `dayjs.tz` geçişi
- Tüm `catch` bloklarına `toast.error`
- Dashboard cache
- BOM versiyonlama + manuel stok finansallaşma

### Sprint 3 — Performans ve UI Mimarisi
- Server-side pagination + React Query kurulumu
- AbortController ile istek iptali
- Component parçalama
- Tailwind CSS / CSS Modules
- Zustand loader + Error Boundary
- Hardcoded değerlerin (rol, KDV) dinamikleşmesi
- KVKK maskeleme

### Sprint 4 — ERP İş Mantığı
- Double-entry Ledger sistemi
- COGS / FIFO maliyet hesaplama
- İrsaliye / Shipment modülü
- Adres normalize
- Satın Alma modülü başlangıcı
- Event-driven mimari geçişi

---

*Bu doküman 4 ayrı fix.md analizinden sentezlenmiştir. Her madde bağımsız olarak uygulanabilir. Kritik maddeler tamamlanmadan yeni özellik geliştirmeye başlanmamalıdır.*