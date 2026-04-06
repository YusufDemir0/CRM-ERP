import { createCrudPage } from './CrudPageFactory';
import {
  departmentsAPI,
  partiesAPI,
  rolesAPI,
  currenciesAPI,
  accountsAPI,
  itemsAPI,
  salesAPI,
  transactionsAPI,
  stocksAPI,
  bomsAPI,
  productionOrdersAPI,
} from '../services/api';

// ─── DEPARTMENTS ───
export const DepartmentsPage = createCrudPage({
  title: 'Departmanlar',
  apiModule: departmentsAPI,
  columns: [
    { key: 'name', label: 'Ad', render: (r: any) => <strong style={{ color: 'var(--text-primary)' }}>{r.name}</strong> },
    { key: 'abbreviation', label: 'Kısaltma' },
    { key: 'departmentType', label: 'Tür', render: (r: any) => r.departmentType?.name || '—' },
    { key: 'description', label: 'Açıklama', render: (r: any) => r.description || '—' },
    { key: 'commercialAccount', label: 'Ticari Hesap', render: (r: any) => r.commercialAccount?.name || '—' },
    { key: 'state', label: 'Durum', render: (r: any) => <span className={`badge ${r.state === 1 ? 'badge-success' : 'badge-danger'}`}>{r.state === 1 ? 'Aktif' : 'Pasif'}</span> },
  ],
  formFields: [
    { key: 'name', label: 'Departman Adı', required: true },
    { key: 'abbreviation', label: 'Kısaltma' },
    { key: 'departmentTypeId', label: 'Departman Türü', apiOptions: { apiFn: departmentsAPI.getTypes, valueKey: 'id', labelKey: 'name' } },
    { 
      key: 'commercialAccountId', 
      label: 'Departmana Bağlı Ticari Hesap', 
      apiOptions: { apiFn: accountsAPI.getAll, valueKey: 'id', labelKey: 'name' }, 
      required: true,
      createLink: { to: '/accounts', label: 'Hesap Oluştur' }
    },
    { key: 'description', label: 'Açıklama', type: 'textarea' },
  ],
  defaultForm: { name: '', abbreviation: '', departmentTypeId: '', commercialAccountId: '', description: '' },
});

// ─── PARTIES (CRM) ───
export const PartiesPage = createCrudPage({
  title: 'Cari Hesaplar',
  apiModule: partiesAPI,
  columns: [
    { key: 'name', label: 'Ad', render: (r: any) => <strong style={{ color: 'var(--text-primary)' }}>{r.name}</strong> },
    { key: 'type', label: 'Tür', render: (r: any) => <span className="badge badge-info">{r.type === 'customer' ? 'Müşteri' : r.type === 'provider' ? 'Tedarikçi' : 'Her İkisi'}</span> },
    { key: 'phone1', label: 'Tlf 1', render: (r: any) => r.phone1 || '—' },
    { key: 'phone2', label: 'Tlf 2', render: (r: any) => r.phone2 || '—' },
    { key: 'balance', label: 'Bakiye', render: (r: any) => <span style={{ color: Number(r.balance) > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{Number(r.balance || 0).toLocaleString('tr-TR')} ₺</span> },
    { key: 'creditLimitPlus', label: 'Limit (+)', render: (r: any) => `${Number(r.creditLimitPlus || 0).toLocaleString('tr-TR')} ₺` },
    { key: 'creditLimitMinus', label: 'Limit (-)', render: (r: any) => `${Number(r.creditLimitMinus || 0).toLocaleString('tr-TR')} ₺` },
    { key: 'state', label: 'Durum', render: (r: any) => <span className={`badge ${r.state === 1 ? 'badge-success' : 'badge-danger'}`}>{r.state === 1 ? 'Aktif' : 'Pasif'}</span> },
  ],
  formFields: [
    { key: 'type', label: 'Tür', options: [{ value: 'customer', label: 'Müşteri' }, { value: 'provider', label: 'Tedarikçi' }, { value: 'both', label: 'Her İkisi' }] },
    { key: 'name', label: 'Ad Soyad / Firma', required: true },
    { key: 'phone1', label: 'Telefon 1' },
    { key: 'phone2', label: 'Telefon 2' },
    { key: 'email', label: 'E-posta' },
    { key: 'taxNumber', label: 'Vergi No' },
    { key: 'address', label: 'Adres', type: 'textarea' },
    { key: 'creditLimitPlus', label: 'Kredi Limiti (Alacak/Risk+)', type: 'number' },
    { key: 'creditLimitMinus', label: 'Kredi Limiti (Borç/Risk-)', type: 'number' },
  ],
  defaultForm: { type: 'customer', name: '', phone1: '', phone2: '', email: '', taxNumber: '', address: '', creditLimitPlus: 0, creditLimitMinus: 0 },
});

// ─── ROLES ───
export const RolesPage = createCrudPage({
  title: 'Roller',
  apiModule: rolesAPI,
  columns: [
    { key: 'name', label: 'Rol Adı', render: (r: any) => <strong style={{ color: 'var(--text-primary)' }}>{r.name}</strong> },
    { key: 'permissions', label: 'Yetki Sayısı', render: (r: any) => <span className="badge badge-accent">{r.permissions?.length || 0} yetki</span> },
    { key: 'state', label: 'Durum', render: (r: any) => <span className={`badge ${r.state === 1 ? 'badge-success' : 'badge-danger'}`}>{r.state === 1 ? 'Aktif' : 'Pasif'}</span> },
  ],
  formFields: [
    { key: 'name', label: 'Rol Adı', required: true },
    { 
      key: 'permissionIds', 
      label: 'Yetkiler (Erişim Sayfaları)', 
      type: 'checkbox-group',
      apiOptions: { apiFn: rolesAPI.getPermissions, valueKey: 'id', labelKey: 'name' }
    },
  ],
  defaultForm: { name: '', permissionIds: [] },
});

// ─── CURRENCIES ───
export const CurrenciesPage = createCrudPage({
  title: 'Para Birimleri',
  apiModule: currenciesAPI,
  columns: [
    { key: 'code', label: 'Kod', render: (r: any) => <strong style={{ color: 'var(--text-primary)' }}>{r.code}</strong> },
    { key: 'name', label: 'Ad' },
    { key: 'symbol', label: 'Sembol' },
    { key: 'exchangeRate', label: 'Kur', render: (r: any) => Number(r.exchangeRate || 1).toFixed(4) },
    { key: 'isDefault', label: 'Varsayılan', render: (r: any) => r.isDefault === 1 ? <span className="badge badge-success">Evet</span> : '—' },
  ],
  formFields: [
    { key: 'code', label: 'Kod (ör: TRY)', required: true },
    { key: 'name', label: 'Ad', required: true },
    { key: 'symbol', label: 'Sembol', required: true },
    { key: 'exchangeRate', label: 'Döviz Kuru', type: 'number' },
  ],
  defaultForm: { code: '', name: '', symbol: '', exchangeRate: '1' },
});

// ─── ACCOUNTS ───
export const AccountsPage = createCrudPage({
  title: 'Banka Hesapları',
  apiModule: accountsAPI,
  columns: [
    { key: 'name', label: 'Hesap Adı', render: (r: any) => <strong style={{ color: 'var(--text-primary)' }}>{r.name}</strong> },
    { key: 'bankName', label: 'Banka', render: (r: any) => r.bankName || '—' },
    { key: 'iban', label: 'IBAN', render: (r: any) => r.iban || '—' },
    { key: 'balance', label: 'Bakiye', render: (r: any) => <span style={{ fontWeight: 600 }}>{Number(r.balance || 0).toLocaleString('tr-TR')} ₺</span> },
  ],
  formFields: [
    { key: 'name', label: 'Hesap Adı', required: true },
    { key: 'bankName', label: 'Banka Adı' },
    { key: 'iban', label: 'IBAN', type: 'iban', placeholder: 'TR00 0000 0000 0000 0000 0000 00' },
    { key: 'ibanName', label: 'IBAN Sahibi' },
    { key: 'currencyId', label: 'Para Birimi', apiOptions: { apiFn: currenciesAPI.getAll, valueKey: 'id', labelKey: 'code' }, required: true },
    { key: 'description', label: 'Açıklama', type: 'textarea' },
  ],
  defaultForm: { name: '', bankName: '', iban: 'TR', ibanName: '', currencyId: '', description: '' },
});

// ─── ITEMS ───
export const ItemsPage = createCrudPage({
  title: 'Ürünler',
  apiModule: itemsAPI,
  columns: [
    { key: 'code', label: 'Kod', render: (r: any) => <span className="badge badge-accent">{r.code}</span> },
    { key: 'name', label: 'Ürün Adı', render: (r: any) => <strong style={{ color: 'var(--text-primary)' }}>{r.name}</strong> },
    { key: 'itemType', label: 'Türü', render: (r: any) => r.itemType?.name || '—' },
    { key: 'purchasePrice', label: 'Alış', render: (r: any) => `${Number(r.purchasePrice || 0).toLocaleString('tr-TR')} ₺` },
    { key: 'salePrice', label: 'Satış', render: (r: any) => `${Number(r.salePrice || 0).toLocaleString('tr-TR')} ₺` },
    { key: 'netPrice', label: 'Net Fiyat', render: (r: any) => `${Number(r.netPrice || 0).toLocaleString('tr-TR')} ₺` },
    { key: 'criticalLimit', label: 'Kr. Limit', render: (r: any) => Number(r.criticalLimit || 0) },
    { key: 'quantityType', label: 'Birim', render: (r: any) => r.quantityType?.abbreviation || '—' },
    { key: 'state', label: 'Durum', render: (r: any) => <span className={`badge ${r.state === 1 ? 'badge-success' : 'badge-danger'}`}>{r.state === 1 ? 'Aktif' : 'Pasif'}</span> },
  ],
  formFields: [
    { key: 'name', label: 'Ürün Adı', required: true },
    { key: 'itemTypeId', label: 'Ürün Türü', apiOptions: { apiFn: itemsAPI.getTypes, valueKey: 'id', labelKey: 'name' }, required: true },
    { key: 'quantityTypeId', label: 'Birim', apiOptions: { apiFn: itemsAPI.getQuantityTypes, valueKey: 'id', labelKey: 'name' }, required: true },
    { key: 'providerId', label: 'Tedarikçi', apiOptions: { apiFn: () => partiesAPI.getAll({ type: 'provider' }), valueKey: 'id', labelKey: 'name' } },
    { key: 'currencyId', label: 'Para Birimi', apiOptions: { apiFn: currenciesAPI.getAll, valueKey: 'id', labelKey: 'code' } },
    { key: 'purchasePrice', label: 'Alış Fiyatı', type: 'number' },
    { key: 'salePrice', label: 'Satış Fiyatı', type: 'number' },
    { key: 'netPrice', label: 'Net Satış Fiyatı', type: 'number' },
    { key: 'criticalLimit', label: 'Kritik Stok Limiti', type: 'number' },
    { key: 'kdv', label: 'KDV (%)', type: 'number' },
    { key: 'description', label: 'Açıklama', type: 'textarea' },
  ],
  defaultForm: { name: '', itemTypeId: '', quantityTypeId: '', providerId: '', currencyId: '', purchasePrice: 0, salePrice: 0, netPrice: 0, criticalLimit: 0, kdv: '20', description: '' },
});

// ─── STOCKS ───
export const StocksPage = createCrudPage({
  title: 'Stok Durumu',
  apiModule: stocksAPI,
  readOnly: true,
  columns: [
    { key: 'item', label: 'Ürün', render: (r: any) => <strong style={{ color: 'var(--text-primary)' }}>{r.item?.name || '—'}</strong> },
    { key: 'itemCode', label: 'Kod', render: (r: any) => <span className="badge badge-accent">{r.item?.code || '—'}</span> },
    { key: 'department', label: 'Departman', render: (r: any) => r.department?.name || '—' },
    { key: 'quantity', label: 'Miktar', render: (r: any) => {
      const qty = Number(r.quantity || 0);
      const critical = Number(r.item?.criticalLimit || 0);
      return <span style={{ fontWeight: 700, color: qty <= critical && critical > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{qty} {r.item?.quantityType?.abbreviation || ''}</span>;
    }},
  ],
  formFields: [],
  defaultForm: {},
});

// ─── SALES ───
export const SalesPage = createCrudPage({
  title: 'Siparişler',
  apiModule: salesAPI,
  columns: [
    { key: 'code', label: 'Sipariş No', render: (r: any) => <strong style={{ color: 'var(--accent)' }}>{r.code}</strong> },
    { key: 'party', label: 'Müşteri', render: (r: any) => r.party?.name || '—' },
    { key: 'grandTotal', label: 'Toplam', render: (r: any) => <span style={{ fontWeight: 600 }}>{Number(r.grandTotal || 0).toLocaleString('tr-TR')} ₺</span> },
    { key: 'status', label: 'Durum', render: (r: any) => {
      const map: Record<string, string> = { draft: 'badge-default', approved: 'badge-success', shipped: 'badge-info', cancelled: 'badge-danger', invoiced: 'badge-warning' };
      const labels: Record<string, string> = { draft: 'Taslak', approved: 'Onaylı', shipped: 'Sevk', cancelled: 'İptal', invoiced: 'Faturalı' };
      return <span className={`badge ${map[r.status] || 'badge-default'}`}>{labels[r.status] || r.status}</span>;
    }},
    { key: 'createdAt', label: 'Tarih', render: (r: any) => new Date(r.createdAt).toLocaleDateString('tr-TR') },
  ],
  formFields: [
    { key: 'partyId', label: 'Cari Hesap (Müşteri)', apiOptions: { apiFn: () => partiesAPI.getAll({ type: 'customer' }), valueKey: 'id', labelKey: 'name' }, required: true },
    { key: 'saleTypeId', label: 'Satış Tipi', apiOptions: { apiFn: salesAPI.getTypes, valueKey: 'id', labelKey: 'name' }, required: true },
    { key: 'currencyId', label: 'Para Birimi', apiOptions: { apiFn: currenciesAPI.getAll, valueKey: 'id', labelKey: 'code' } },
    { key: 'deliveryDate', label: 'Teslim Tarihi', type: 'date' },
    { key: 'deposit', label: 'Peşinat', type: 'number' },
    { key: 'notes', label: 'Notlar', type: 'textarea' },
    { key: 'items', label: 'Sipariş Kalemleri', type: 'subtable', subFields: [
      { key: 'itemId', label: 'Ürün', apiOptions: { apiFn: itemsAPI.getAll, valueKey: 'id', labelKey: 'name' }, required: true, gridCols: 3 },
      { key: 'quantity', label: 'Miktar', type: 'number', required: true, gridCols: 1 },
      { key: 'price', label: 'Birim Fiyat', type: 'number', required: true, gridCols: 1 },
      { key: 'discountAmount', label: 'İndirim Tutar', type: 'number', gridCols: 1 },
      { key: 'kdvRate', label: 'KDV (%)', type: 'number', gridCols: 1 },
    ]},
  ],
  defaultForm: { partyId: '', saleTypeId: '', currencyId: '', deliveryDate: '', deposit: '', notes: '', items: [] },
});

// ─── TRANSACTIONS ───
export const TransactionsPage = createCrudPage({
  title: 'Finansal İşlemler',
  apiModule: transactionsAPI,
  columns: [
    { key: 'code', label: 'İşlem No', render: (r: any) => <strong style={{ color: 'var(--text-primary)' }}>{r.code}</strong> },
    { key: 'party', label: 'Cari', render: (r: any) => r.party?.name || '—' },
    { key: 'type', label: 'Tür', render: (r: any) => <span className={`badge ${r.type === 'in' ? 'badge-success' : 'badge-danger'}`}>{r.type === 'in' ? 'Tahsilat' : 'Tediye'}</span> },
    { key: 'amount', label: 'Tutar', render: (r: any) => <span style={{ fontWeight: 600 }}>{Number(r.amount || 0).toLocaleString('tr-TR')} ₺</span> },
    { key: 'date', label: 'Tarih', render: (r: any) => new Date(r.date).toLocaleDateString('tr-TR') },
    { key: 'status', label: 'Durum', render: (r: any) => <span className="badge badge-success">{r.status}</span> },
  ],
  formFields: [
    { key: 'partyId', label: 'Cari Hesap', apiOptions: { apiFn: partiesAPI.getAll, valueKey: 'id', labelKey: 'name' }, required: true },
    { key: 'commercialAccountId', label: 'Banka Hesabı', apiOptions: { apiFn: accountsAPI.getAll, valueKey: 'id', labelKey: 'name' }, required: true },
    { key: 'type', label: 'İşlem Tipi', options: [{ value: 'in', label: 'Tahsilat (Giriş)' }, { value: 'out', label: 'Ödeme (Çıkış)' }], required: true },
    { key: 'amount', label: 'Tutar', type: 'number', required: true },
    { key: 'currencyId', label: 'Para Birimi', apiOptions: { apiFn: currenciesAPI.getAll, valueKey: 'id', labelKey: 'code' } },
    { key: 'date', label: 'İşlem Tarihi', type: 'date', required: true },
    { key: 'description', label: 'Açıklama', type: 'textarea' },
  ],
  defaultForm: { partyId: '', commercialAccountId: '', type: 'in', amount: '', currencyId: '', date: new Date().toISOString().split('T')[0], description: '' },
});

// ─── PRODUCTION BOMS ───
export const BomsPage = createCrudPage({
  title: 'Ürün Reçeteleri (BOM)',
  apiModule: bomsAPI,
  columns: [
    { key: 'name', label: 'Reçete Adı' },
    { key: 'description', label: 'Açıklama' },
  ],
  formFields: [
    { key: 'name', label: 'Reçete Adı', required: true },
    { key: 'description', label: 'Açıklama', type: 'textarea' },
    { key: 'items', label: 'Reçete (BOM) Kalemleri', type: 'subtable', subFields: [
      { key: 'itemId', label: 'Malzeme / Ürün', apiOptions: { apiFn: itemsAPI.getAll, valueKey: 'id', labelKey: 'name' }, required: true },
      { key: 'quantity', label: 'Miktar', type: 'number', required: true },
      { key: 'description', label: 'Açıklama' },
    ]},
  ],
  defaultForm: { name: '', description: '', items: [] },
});

// ─── PRODUCTION ORDERS ───
export const ProductionPage = createCrudPage({
  title: 'Üretim Emirleri',
  apiModule: productionOrdersAPI,
  columns: [
    { key: 'code', label: 'Emir No', render: (r: any) => <strong style={{ color: 'var(--text-primary)' }}>{r.code}</strong> },
    { key: 'bom', label: 'Ürün Reçetesi', render: (r: any) => r.bom?.name || '—' },
    { key: 'plannedQuantity', label: 'Planlanan' },
    { key: 'producedQuantity', label: 'Üretilen' },
    { key: 'wastageQuantity', label: 'Fire' },
    { key: 'status', label: 'Durum', render: (r: any) => {
      const map: Record<string, string> = { 'draft': 'badge-warning', 'planned': 'badge-info', 'in_progress': 'badge-primary', 'completed': 'badge-success', 'cancelled': 'badge-danger' };
      const labels: Record<string, string> = { draft: 'Taslak', planned: 'Planlandı', in_progress: 'Üretimde', completed: 'Tamamlandı', cancelled: 'İptal' };
      return <span className={`badge ${map[r.status] || 'badge-default'}`}>{labels[r.status] || r.status}</span>;
    }},
  ],
  formFields: [
    { key: 'bomId', label: 'Ürün Reçetesi (BOM) Şablonu', apiOptions: { apiFn: bomsAPI.getAll, valueKey: 'id', labelKey: 'name' }, required: true },
    { key: 'plannedQuantity', label: 'Planlanan Üretim Miktarı', type: 'number', required: true },
    { key: 'startDate', label: 'Başlangıç Tarihi', type: 'date' },
    { key: 'endDate', label: 'Bitiş Tarihi', type: 'date' },
    { key: 'notes', label: 'Notlar', type: 'textarea' },
  ],
  defaultForm: { bomId: '', plannedQuantity: '', startDate: '', endDate: '', notes: '' },
});
