import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { FiX, FiCheck, FiAlertTriangle, FiShoppingBag, FiTruck, FiPlus, FiSearch, FiTrash2, FiUsers, FiCreditCard } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sale, Department, Account, Vehicle, Staff } from '../../types';
import { accountsAPI, vehiclesAPI, staffAPI } from '../../services/api';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { Decimal } from 'decimal.js';
import { PremiumNumberInput } from '../common/PremiumNumberInput';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';

/* ──────────────────────────── SEARCHABLE MULTI-SELECT ──────────────────────────── */

interface SearchableMultiSelectProps {
  items: Array<{ id: string; label: string; sub?: string }>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  emptyText?: string;
}

const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  items,
  selectedIds,
  onChange,
  placeholder = 'Ara...',
  emptyText = 'Kayıt bulunamadı.',
}) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) => i.label.toLowerCase().includes(q) || (i.sub && i.sub.toLowerCase().includes(q))
    );
  }, [items, search]);

  const toggle = useCallback(
    (id: string) => {
      if (selectedIds.includes(id)) {
        onChange(selectedIds.filter((x) => x !== id));
      } else {
        onChange([...selectedIds, id]);
      }
    },
    [selectedIds, onChange]
  );

  const selectedItems = items.filter((i) => selectedIds.includes(i.id));

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Selected chips + search input */}
      <div
        className="min-h-[44px] px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white flex flex-wrap gap-1.5 items-center cursor-text transition-colors focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary-glow)]"
        onClick={() => { setIsOpen(true); }}
      >
        {selectedItems.map((item) => (
          <span
            key={item.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--primary-glow)] text-[var(--primary)] text-[10px] font-black uppercase tracking-wide border border-[var(--primary)]/15 shrink-0"
          >
            {item.label}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggle(item.id);
              }}
              className="hover:text-red-500 transition-colors ml-0.5"
            >
              <FiX size={10} strokeWidth={3} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedIds.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[60px] h-7 text-xs font-bold text-slate-700 bg-transparent outline-none placeholder:text-slate-350"
        />
        <FiSearch size={14} className="text-slate-350 shrink-0" />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 max-h-[200px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
          {filtered.length === 0 ? (
            <div className="p-3 text-xs text-slate-400 font-bold italic text-center">{emptyText}</div>
          ) : (
            filtered.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-bold transition-colors ${
                    isSelected
                      ? 'bg-[var(--primary-glow)] text-[var(--primary)]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[var(--primary)] border-[var(--primary)]'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <FiCheck size={10} className="text-white" strokeWidth={3} />}
                  </span>
                  <span className="truncate">{item.label}</span>
                  {item.sub && <span className="ml-auto text-[10px] text-slate-400 font-bold shrink-0">{item.sub}</span>}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

/* ──────────────────────────── MAIN MODAL ──────────────────────────── */

interface ShipmentWizardModalProps {
  sale: Sale;
  departments: Department[];
  onSubmit: (
    payments: Array<{ commercialAccountId: string; amount: number }>,
    vehicleIds: string[],
    assignedStaffIds: string[]
  ) => void;
  onClose: () => void;
}

interface PaymentRow {
  id: number;
  accountId: string;
  amount: number;
}

export const ShipmentWizardModal: React.FC<ShipmentWizardModalProps> = ({
  sale,
  departments,
  onSubmit,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { openCreate } = useQuickCreateStore();

  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  // Inline vehicle creation form state
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicleName, setNewVehicleName] = useState('');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleDesc, setNewVehicleDesc] = useState('');

  // Financial values
  const grandTotal = new Decimal(sale.grandTotal || 0);
  const paidAmount = new Decimal(sale.paidAmount || 0);
  const remainingAmount = grandTotal.minus(paidAmount);
  const hasRemainingDebt = remainingAmount.gt(0.01);

  // Dynamic payment rows — start with 1, amount prefilled as 0
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([
    {
      id: 1,
      accountId: sale.commercialAccountId ? String(sale.commercialAccountId) : '',
      amount: 0,
    },
  ]);
  const [nextPaymentId, setNextPaymentId] = useState(2);
  // Queries
  const { data: accountsData = [] } = useQuery<Account[]>({
    queryKey: ['accounts', 'active-list'],
    queryFn: async () => {
      const res = await accountsAPI.getAll({ state: 1, limit: 100, ignorePermissionRestrictions: 'true' });
      return res.data?.data || [];
    },
  });

  // Memoize sorted accounts prioritizing the associated cashbox
  const sortedAccounts = useMemo(() => {
    if (!accountsData || accountsData.length === 0) return [];
    const assocId = sale.commercialAccountId ? String(sale.commercialAccountId) : '';
    const associated = accountsData.filter((a: Account) => String(a.id) === assocId);
    const others = accountsData.filter((a: Account) => String(a.id) !== assocId);
    return [...associated, ...others];
  }, [accountsData, sale.commercialAccountId]);

  const { data: vehiclesData = [] } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await vehiclesAPI.getAll();
      return res.data || [];
    },
  });

  const { data: staffData = [] } = useQuery<Staff[]>({
    queryKey: ['staff', 'active-list'],
    queryFn: async () => {
      const res = await staffAPI.getAll({ state: 1, limit: 100 });
      return res.data?.data || [];
    },
  });

  // Vehicle mutation
  const createVehicleMutation = useMutation({
    mutationFn: (data: { name: string; plate: string; description?: string }) =>
      vehiclesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Araç başarıyla eklendi.');
      setShowAddVehicle(false);
      setNewVehicleName('');
      setNewVehiclePlate('');
      setNewVehicleDesc('');
    },
    onError: (err: unknown) => {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Araç eklenemedi.';
      toast.error(errorMsg);
    },
  });

  // Staff quick create handler
  const handleQuickCreateStaff = () => {
    openCreate('staff', {
      mode: 'quick',
      initialData: { departmentId: sale.departmentId || '', unit: 'SEVK' },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['staff'] });
        toast.success('Personel başarıyla eklendi.');
      },
    });
  };

  // ---- Payment row helpers ----
  const addPaymentRow = () => {
    setPaymentRows((prev) => [...prev, { id: nextPaymentId, accountId: '', amount: 0 }]);
    setNextPaymentId((n) => n + 1);
  };

  const removePaymentRow = (rowId: number) => {
    if (paymentRows.length <= 1) return;
    setPaymentRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const updatePaymentRow = (rowId: number, field: 'accountId' | 'amount', value: string | number) => {
    setPaymentRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r))
    );
  };

  // Recalculate first row amount disabled per user requirement: 'rakamlar silmede değiştirmede kendilerini değiştirmeyecek'

  // Validation
  const totalPaymentEntered = paymentRows.reduce(
    (acc, r) => acc.plus(new Decimal(r.amount || 0)),
    new Decimal(0)
  );
  const isDebtCovered = !hasRemainingDebt || totalPaymentEntered.minus(remainingAmount).abs().lt(0.01);
  const allAccountsSelected =
    !hasRemainingDebt ||
    paymentRows.every((r) => (r.amount > 0.001 ? !!r.accountId : true));

  const isFormValid = isDebtCovered && allAccountsSelected;

  const handleConfirm = async () => {
    if (!isFormValid) return;

    // Resolve driver/vehicle names for confirmation dialog
    const staffNames = selectedStaffIds
      .map(id => staffData.find((s: Staff) => String(s.id) === String(id)))
      .filter(Boolean)
      .map((s) => s ? `${s.firstName} ${s.lastName}` : '')
      .filter(Boolean)
      .join(', ') || 'Belirtilmemiş';

    const vehiclePlates = selectedVehicleIds
      .map(id => vehiclesData.find((v: Vehicle) => String(v.id) === String(id)))
      .filter(Boolean)
      .map((v) => v?.plate || '')
      .filter(Boolean)
      .join(', ') || 'Belirtilmemiş';

    const accountNames = paymentRows
      .map(row => sortedAccounts.find((a: Account) => String(a.id) === String(row.accountId)))
      .filter(Boolean)
      .map((a) => a?.name?.toUpperCase() || '')
      .filter(Boolean)
      .join(', ') || 'Belirtilmemiş';

    const payments: Array<{ commercialAccountId: string; amount: number }> = [];
    if (hasRemainingDebt) {
      for (const row of paymentRows) {
        if (row.amount > 0.001 && row.accountId) {
          payments.push({ commercialAccountId: row.accountId, amount: row.amount });
        }
      }
    }

    const confirmed = await confirmDialog(
      `${sale.code} numaralı fişi ${staffNames} şöförle ${vehiclePlates} bu araçla kalan tutar ${remainingAmount.toNumber().toLocaleString('tr-TR')} TL'yi ${accountNames} kasasına giriş yapıyorsunuz. Onaylıyor musunuz?`,
      false
    );

    if (confirmed) {
      onSubmit(payments, selectedVehicleIds, selectedStaffIds);
    }
  };

  // Dropdown data mappers
  const vehicleItems = useMemo(
    () =>
      vehiclesData.map((v: Vehicle) => ({
        id: v.id,
        label: `${v.plate}`,
        sub: v.name,
      })),
    [vehiclesData]
  );

  const staffItems = useMemo(
    () =>
      staffData.map((s: Staff) => ({
        id: s.id,
        label: `${s.firstName} ${s.lastName}`,
        sub: s.department?.name || '',
      })),
    [staffData]
  );

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white max-w-[1100px] w-full p-0 rounded-3xl shadow-2xl border border-slate-100 flex flex-col text-slate-800 my-4 overflow-hidden">
        {/* ────── Header ────── */}
        <div className="px-7 py-5 flex justify-between items-center border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="text-left">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FiTruck className="text-[var(--primary)]" /> Sevkiyat Onayı
            </h2>
            <p className="text-[10px] text-slate-450 font-bold mt-0.5">
              Sipariş:{' '}
              <span className="text-slate-800 font-black">{sale.code}</span> • Cari:{' '}
              <span className="text-slate-850 font-black">{sale.party?.name}</span>
            </p>
          </div>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* ────── Financial Summary Bar ────── */}
        <div className="px-7 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <FiShoppingBag size={14} className="text-[var(--primary)]" />
            <span className="text-[10px] font-black text-slate-400 uppercase">Toplam:</span>
            <span className="text-xs font-black text-slate-800 tabular-nums">
              {grandTotal.toNumber().toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}
            </span>
          </div>
          <div className="w-px h-5 bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">Ödenen:</span>
            <span className="text-xs font-black text-emerald-600 tabular-nums">
              {paidAmount.toNumber().toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}
            </span>
          </div>
          <div className="w-px h-5 bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">Kalan:</span>
            <span
              className={`text-xs font-black tabular-nums ${
                hasRemainingDebt ? 'text-rose-600' : 'text-slate-500'
              }`}
            >
              {remainingAmount.toNumber().toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}
            </span>
          </div>

          {/* Warehouse info */}
          <div className="ml-auto text-[10px] font-bold text-slate-450">
            Çıkış Deposu:{' '}
            <span className="font-black text-[var(--primary)] uppercase">
              {sale.department?.name || 'Fiziksel Depo'}
            </span>
          </div>
        </div>

        {/* ────── Main Body: Two Columns ────── */}
        <div className="flex flex-1 min-h-0">
          {/* LEFT COLUMN — Sevkiyat */}
          <div className="flex-1 p-6 flex flex-col gap-5 border-r border-slate-100 overflow-y-auto max-h-[60vh]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-[var(--primary-glow)] flex items-center justify-center">
                <FiTruck size={14} className="text-[var(--primary)]" />
              </div>
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Sevkiyat Bilgileri</h3>
            </div>

            {/* Vehicle searchable multi-select */}
            <div className="flex flex-col gap-1.5 text-left">
              <div className="flex justify-between items-center px-0.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Araç / Plaka Seçimi
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddVehicle(!showAddVehicle)}
                  className="text-[10px] font-black text-[var(--primary)] hover:text-[var(--primary)]/80 flex items-center gap-1 uppercase tracking-widest"
                >
                  <FiPlus size={11} /> Yeni Araç
                </button>
              </div>

              {showAddVehicle && (
                <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl flex flex-col gap-2.5 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      placeholder="Araç Adı"
                      value={newVehicleName}
                      onChange={(e) => setNewVehicleName(e.target.value)}
                      className="h-9 px-3 text-xs font-bold border border-slate-200 rounded-lg bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Plaka"
                      value={newVehiclePlate}
                      onChange={(e) => setNewVehiclePlate(e.target.value)}
                      className="h-9 px-3 text-xs font-bold border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div className="flex gap-2.5 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAddVehicle(false)}
                      className="px-3 h-8 text-[10px] font-black bg-slate-200 text-slate-600 rounded-lg"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newVehicleName || !newVehiclePlate) {
                          toast.error('Araç adı ve plaka zorunludur.');
                          return;
                        }
                        createVehicleMutation.mutate({
                          name: newVehicleName,
                          plate: newVehiclePlate,
                          description: newVehicleDesc,
                        });
                      }}
                      className="px-3 h-8 text-[10px] font-black bg-[var(--primary)] text-white rounded-lg hover:brightness-110"
                    >
                      Kaydet
                    </button>
                  </div>
                </div>
              )}

              <SearchableMultiSelect
                items={vehicleItems}
                selectedIds={selectedVehicleIds}
                onChange={setSelectedVehicleIds}
                placeholder="Plaka veya araç adı ile ara..."
                emptyText="Tanımlı araç bulunamadı."
              />
            </div>

            {/* Staff searchable multi-select */}
            <div className="flex flex-col gap-1.5 text-left">
              <div className="flex justify-between items-center px-0.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Sevkiyat Sorumluları
                </label>
                <button
                  type="button"
                  onClick={handleQuickCreateStaff}
                  className="text-[10px] font-black text-[var(--primary)] hover:text-[var(--primary)]/80 flex items-center gap-1 uppercase tracking-widest"
                >
                  <FiPlus size={11} /> Yeni Personel
                </button>
              </div>

              <SearchableMultiSelect
                items={staffItems}
                selectedIds={selectedStaffIds}
                onChange={setSelectedStaffIds}
                placeholder="Personel adı ile ara..."
                emptyText="Aktif personel bulunamadı."
              />
            </div>

            {/* Items being shipped (Read-only) */}
            <div className="flex flex-col gap-1.5 text-left mt-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-0.5">
                Sevk Edilecek Ürünler
              </label>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                {sale.items?.map((i, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 text-xs font-bold text-slate-700"
                  >
                    <span className="truncate">{i.item?.name || `Ürün #${i.itemId}`}</span>
                    <span className="text-[var(--primary)] font-black tabular-nums shrink-0 ml-2">
                      {Number(i.quantity)} Adet
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — Tahsilat */}
          <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto max-h-[60vh]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <FiCreditCard size={14} className="text-amber-600" />
              </div>
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Tahsilat Bilgileri</h3>
            </div>

            {hasRemainingDebt ? (
              <>
                {/* Warning banner */}
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-150 flex gap-2.5 text-left">
                  <FiAlertTriangle className="text-amber-500 text-base shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-amber-800">
                      Kalan Borç Tahsilatı
                    </h4>
                    <p className="text-[10px] font-bold text-amber-700 mt-0.5">
                      Kalan{' '}
                      <strong className="tabular-nums">
                        {remainingAmount.toNumber().toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}
                      </strong>{' '}
                      borcun tahsili gereklidir.
                    </p>
                  </div>
                </div>

                {/* Payment rows */}
                <div className="flex flex-col gap-3">
                  {paymentRows.map((row, index) => (
                    <div
                      key={row.id}
                      className="p-3.5 rounded-xl border border-slate-200/60 bg-slate-50/50 flex flex-col gap-2.5 text-left animate-in fade-in slide-in-from-top-1 duration-150"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Kasa/Banka {index + 1}
                        </span>
                        {paymentRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePaymentRow(row.id)}
                            className="text-slate-350 hover:text-red-500 transition-colors"
                            title="Bu satırı kaldır"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        )}
                      </div>

                      <select
                        className={`h-10 px-3 rounded-lg border font-black text-slate-700 text-xs ${
                          row.accountId === String(sale.commercialAccountId)
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 bg-white'
                        }`}
                        value={row.accountId}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && paymentRows.some((r) => r.id !== row.id && r.accountId === val)) {
                            toast.error('Bu kasa zaten eklenmiş.');
                            return;
                          }
                          updatePaymentRow(row.id, 'accountId', val);
                        }}
                      >
                        <option value="">-- Kasa/Banka Seçiniz --</option>
                        {sortedAccounts.map((acc: Account) => {
                          const isAssoc = String(acc.id) === String(sale.commercialAccountId);
                          return (
                            <option key={acc.id} value={acc.id}>
                              {isAssoc ? '⭐ [İLİŞKİLİ KASA] ' : ''}
                              {acc.name.toUpperCase()}{' '}
                              {acc.bankName ? `(${acc.bankName})` : '(KASA)'}
                            </option>
                          );
                        })}
                      </select>

                      <PremiumNumberInput
                        value={row.amount}
                        onChange={(val) => {
                          updatePaymentRow(row.id, 'amount', val);
                        }}
                        className="h-10 text-xs"
                      />
                    </div>
                  ))}

                  {/* Add payment row button */}
                  <button
                    type="button"
                    onClick={addPaymentRow}
                    className="flex items-center justify-center gap-1.5 h-10 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors text-[10px] font-black uppercase tracking-widest"
                  >
                    <FiPlus size={13} /> Kasa/Banka Ekle
                  </button>
                </div>

                {/* Validation status */}
                <div className="mt-auto pt-2">
                  {totalPaymentEntered.minus(remainingAmount).abs().gt(0.01) ? (
                    <div className="text-[10px] text-rose-500 font-extrabold bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl text-center">
                      Tutarlar Eşleşmiyor! Girilen:{' '}
                      {totalPaymentEntered.toNumber().toLocaleString('tr-TR')} ₺, Gerekli:{' '}
                      {remainingAmount.toNumber().toLocaleString('tr-TR')} ₺
                    </div>
                  ) : (
                    <div className="text-[10px] text-emerald-650 font-black bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-center">
                      ✓ Tutarlar Tam Uyumlu
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-150 text-emerald-800 text-left flex gap-3 flex-1 items-start">
                <FiCheck className="text-emerald-500 text-xl shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-wider">
                    Borç Bulunmamaktadır
                  </h4>
                  <p className="text-[11px] font-bold text-emerald-700/90 mt-0.5">
                    Sipariş bedeli tamamen kaporayla tahsil edilmiştir. Sevkiyata doğrudan
                    başlayabilirsiniz.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ────── Footer ────── */}
        <div className="px-7 py-4 flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-6 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-black rounded-xl transition-all"
          >
            Vazgeç
          </button>
          <button
            type="button"
            disabled={!isFormValid}
            onClick={handleConfirm}
            className={`h-11 px-8 text-xs font-black rounded-xl flex items-center gap-2 transition-all ${
              isFormValid
                ? 'bg-[var(--primary)] text-white hover:brightness-110 hover:scale-[1.02] shadow-lg shadow-[var(--primary-glow)]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <FiCheck size={16} strokeWidth={3} /> SEVK ET VE BİTİR
          </button>
        </div>
      </div>
    </div>
  );
};
