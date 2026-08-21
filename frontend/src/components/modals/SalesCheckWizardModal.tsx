import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash, FiCheck, FiAlertTriangle, FiCreditCard, FiArrowRight, FiArrowLeft, FiShoppingBag, FiTrendingUp } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { Sale, SaleItem, Department, Account } from '../../types';
import { accountsAPI } from '../../services/api';
import { formatDisplayDate } from '../../utils/date.helper';
import { Decimal } from 'decimal.js';
import toast from 'react-hot-toast';

interface SalesCheckWizardModalProps {
  sale: Sale;
  departments: Department[];
  onSubmit: (allocations: Array<{ itemId: string; departmentId: string; quantity: number }>, commercialAccountId?: string) => void;
  onClose: () => void;
}

interface Allocation {
  departmentId: string;
  quantity: number;
}

export const SalesCheckWizardModal: React.FC<SalesCheckWizardModalProps> = ({
  sale,
  departments,
  onSubmit,
  onClose,
}) => {
  // Enforce PHYSICAL-ONLY warehouse validation. Filter out 'sanaldepo', 'satisdepo' and similar virtual entities.
  const activePhysicalDepts = departments.filter(d => {
    if (d.state !== 1) return false;
    const nameLower = d.name.toLowerCase();
    const codeLower = (d.abbreviation || '').toLowerCase();
    return (
      codeLower !== 'sanaldepo' && 
      codeLower !== 'satisdepo' && 
      !nameLower.includes('sanal') && 
      !nameLower.includes('satış')
    );
  });

  const defaultDeptId = activePhysicalDepts[0]?.id ? String(activePhysicalDepts[0].id) : '';

  // Stepper state: 1 -> Risk & Review, 2 -> Depo & Dağılım
  const [step, setStep] = useState<number>(1);

  // Step 2 state: Allocations keyed by itemId
  const [allocations, setAllocations] = useState<Record<string, Allocation[]>>({});
  const [globalDeptId, setGlobalDeptId] = useState<string>(defaultDeptId);

  // Step 2 state: Commercial Account
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    sale.commercialAccountId ? String(sale.commercialAccountId) : ''
  );

  const { data: accountsData = [] } = useQuery({
    queryKey: ['accounts', 'active-list'],
    queryFn: async () => {
      const res = await accountsAPI.getAll({ state: 1, limit: 105, ignorePermissionRestrictions: 'true' });
      return res.data?.data || [];
    },
  });

  // Initialize allocations on open
  useEffect(() => {
    const initialAllocations: Record<string, Allocation[]> = {};

    sale.items?.forEach(item => {
      initialAllocations[item.itemId] = [
        { departmentId: defaultDeptId, quantity: Math.round(Number(item.quantity || 0)) }
      ];
    });

    setAllocations(initialAllocations);
  }, [sale, defaultDeptId]);

  // Apply default department globally
  const handleGlobalApply = () => {
    if (!globalDeptId) return;
    const nextAllocations = { ...allocations };
    sale.items?.forEach(item => {
      nextAllocations[item.itemId] = [
        { departmentId: globalDeptId, quantity: Math.round(Number(item.quantity || 0)) }
      ];
    });
    setAllocations(nextAllocations);
  };

  const handleAddRow = (itemId: string) => {
    setAllocations(prev => {
      const currentList = prev[itemId] || [];
      const item = sale.items?.find(i => i.itemId === itemId);
      let remainingQty = 0;
      if (item) {
        const totalQty = Math.round(Number(item.quantity || 0));
        const allocatedQty = currentList.reduce((sum, r) => sum + Math.round(Number(r.quantity || 0)), 0);
        remainingQty = Math.max(0, totalQty - allocatedQty);
      }
      return {
        ...prev,
        [itemId]: [...currentList, { departmentId: globalDeptId || defaultDeptId, quantity: remainingQty }]
      };
    });
  };

  const handleRemoveRow = (itemId: string, index: number) => {
    setAllocations(prev => {
      const currentList = [...(prev[itemId] || [])];
      currentList.splice(index, 1);
      return {
        ...prev,
        [itemId]: currentList
      };
    });
  };

  const handleUpdateRow = (itemId: string, index: number, field: keyof Allocation, value: any) => {
    setAllocations(prev => {
      const currentList = [...(prev[itemId] || [])];
      let val = value;
      if (field === 'quantity') {
        if (value === '') {
          val = 0;
        } else {
          const parsed = parseInt(value, 10);
          val = isNaN(parsed) ? 0 : parsed;
        }
      }
      currentList[index] = {
        ...currentList[index],
        [field]: val
      };
      return {
        ...prev,
        [itemId]: currentList
      };
    });
  };

  // Validation
  const checkValidation = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    let isValid = true;

    sale.items?.forEach(item => {
      const itemAllocations = allocations[item.itemId] || [];
      const sum = itemAllocations.reduce((acc, curr) => acc + curr.quantity, 0);
      const total = Number(item.quantity);

      if (Math.abs(sum - total) > 0.0001) {
        errors[item.itemId] = `Miktar uyuşmuyor! Seçilen: ${sum}, Gerekli: ${total}`;
        isValid = false;
      }

      const hasEmptyDept = itemAllocations.some(row => !row.departmentId);
      if (hasEmptyDept) {
        errors[item.itemId] = `Lütfen tüm satırlar için depo seçiniz.`;
        isValid = false;
      }
    });

    return { isValid, errors };
  };

  const { isValid, errors: validationErrors } = checkValidation();

  // Credit and Risk calculations
  const partyBalance = new Decimal(sale.party?.balance || 0);
  const partyLimit = new Decimal(sale.party?.creditLimit || 0);
  const grandTotal = new Decimal(sale.grandTotal || 0);
  const projectedBalance = partyBalance.plus(grandTotal);
  const isOverLimit = partyLimit.gt(0) && projectedBalance.gt(partyLimit);

  const handleConfirm = () => {
    if (!isValid) return;

    const flattenedList: Array<{ itemId: string; departmentId: string; quantity: number }> = [];
    Object.entries(allocations).forEach(([itemId, rows]) => {
      rows.forEach(row => {
        if (row.quantity > 0) {
          flattenedList.push({
            itemId,
            departmentId: row.departmentId,
            quantity: row.quantity
          });
        }
      });
    });

    onSubmit(flattenedList, selectedAccountId || undefined);
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-slate-900/60 animate-in fade-in duration-200">
      <div className="bg-white max-w-[1200px] w-full max-h-[90vh] rounded-3xl shadow-2xl border border-slate-100 flex flex-col text-slate-800">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 sm:p-8 border-b border-slate-100 shrink-0">
          <div className="text-left">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FiCheck className="text-primary" /> Satış Kontrol Sihirbazı
            </h2>
            <p className="text-xs text-slate-450 font-bold mt-1">
              Sipariş: <span className="text-slate-800">{sale.code}</span> • Müşteri: <span className="text-slate-850 font-black">{sale.party?.name}</span>
            </p>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 transition-colors" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        {/* Stepper Steps UI */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 py-3 border-b border-slate-50 shrink-0">
          <div className={`flex items-center gap-2 pb-2 px-3 border-b-2 font-black text-xs uppercase tracking-widest transition-all ${
            step === 1 ? 'border-primary text-primary' : 'border-transparent text-slate-400'
          }`}>
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black">1</span>
            Risk & Sipariş Kontrolü
          </div>
          <div className="w-8 h-[1px] bg-slate-200 mb-2" />
          <div className={`flex items-center gap-2 pb-2 px-3 border-b-2 font-black text-xs uppercase tracking-widest transition-all ${
            step === 2 ? 'border-primary text-primary' : 'border-transparent text-slate-400'
          }`}>
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black">2</span>
            Depo & Dağılım
          </div>
        </div>

        {/* STEP 1: RISK & ORDER REVIEW */}
        {step === 1 && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col gap-6 text-left animate-in fade-in duration-300">
            
            {/* Risk Warnings */}
            {isOverLimit && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex gap-3">
                <FiAlertTriangle className="text-amber-500 text-2xl shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider">KREDİ LİMİTİ AŞILMA RİSKİ!</h4>
                  <p className="text-xs font-bold text-amber-700/90 mt-1">
                    Bu cari hesabın bakiye ve bu sipariş toplamı limitini aşmaktadır. Cari Bakiye: <strong className="tabular-nums">{partyBalance.toNumber().toLocaleString('tr-TR')} ₺</strong>, Limit: <strong className="tabular-nums">{partyLimit.toNumber().toLocaleString('tr-TR')} ₺</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Customer Details Card */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col gap-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FiTrendingUp className="text-primary text-sm" /> MÜŞTERİ BİLGİ KARTI
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-slate-200/40 pb-2">
                    <span className="text-xs text-slate-450 font-bold">Müşteri Adı</span>
                    <span className="text-xs font-extrabold text-slate-700">{sale.party?.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/40 pb-2">
                    <span className="text-xs text-slate-450 font-bold">Sipariş Adresi</span>
                    <span className="text-xs font-extrabold text-slate-700 uppercase">
                      {`${sale.address || ''} ${sale.district || ''} / ${sale.city || ''}`.trim() || 'BELİRTİLMEMİŞ'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/40 pb-2">
                    <span className="text-xs text-slate-450 font-bold">Genel Borç Durumu (Bakiye)</span>
                    <span className="text-xs font-black text-slate-800 tabular-nums">
                      {sale.party?.balance ? (() => {
                        const bal = new Decimal(sale.party.balance).negated();
                        const isAl = bal.gt(0);
                        const isZe = bal.isZero();
                        return (
                          <>
                            {isZe ? '' : isAl ? '+' : ''}{bal.toNumber().toLocaleString('tr-TR')} ₺
                            <span className={`ml-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                              isZe ? 'bg-slate-50 text-slate-400 border-slate-200' :
                              isAl ? 'bg-success/5 text-success border-success/10' : 'bg-danger/5 text-danger border-danger/10'
                            }`}>
                              {isZe ? 'Bakiye Yok' : isAl ? 'Alacaklı' : 'Borçlu'}
                            </span>
                          </>
                        );
                      })() : '0 ₺'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-450 font-bold">Kredi Limiti</span>
                    <span className="text-xs font-black text-slate-800 tabular-nums">{partyLimit.toNumber() > 0 ? `${partyLimit.toNumber().toLocaleString('tr-TR')} ₺` : 'LİMİTSİZ'}</span>
                  </div>
                </div>
              </div>

              {/* Order Info Card */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col gap-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FiShoppingBag className="text-primary text-sm" /> SİPARİŞ TUTAR DETAYI
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-slate-200/40 pb-2">
                    <span className="text-xs text-slate-450 font-bold">Ara Toplam</span>
                    <span className="text-xs font-extrabold text-slate-700 tabular-nums">{new Decimal(sale.totalAmount || 0).toNumber().toLocaleString('tr-TR')} ₺</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/40 pb-2">
                    <span className="text-xs text-slate-450 font-bold">KDV Toplamı</span>
                    <span className="text-xs font-extrabold text-slate-700 tabular-nums">{new Decimal(sale.kdv || 0).toNumber().toLocaleString('tr-TR')} ₺</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/40 pb-2">
                    <span className="text-xs text-slate-450 font-bold">Kapora (Ödenen)</span>
                    <span className="text-xs font-black text-emerald-600 tabular-nums">-{new Decimal(sale.paidAmount || 0).toNumber().toLocaleString('tr-TR')} ₺</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-450 font-bold">Genel Toplam</span>
                    <span className="text-lg font-black text-slate-900 tabular-nums">{grandTotal.toNumber().toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Items List Summary */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-black text-slate-600 uppercase tracking-widest text-[10px]">Ürün Adı</th>
                    <th className="p-4 font-black text-slate-600 uppercase tracking-widest text-[10px] text-center w-[120px]">Miktar</th>
                    <th className="p-4 font-black text-slate-600 uppercase tracking-widest text-[10px] text-right">Birim Fiyat</th>
                    <th className="p-4 font-black text-slate-600 uppercase tracking-widest text-[10px] text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items?.map((item: SaleItem) => (
                    <tr key={item.itemId} className="border-b border-slate-100 hover:bg-slate-50/20">
                      <td className="p-4 text-left">
                        <div className="font-extrabold text-slate-800">{item.item?.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold tracking-wider mt-1">{item.item?.code}</div>
                      </td>
                      <td className="p-4 text-center font-black text-sm tabular-nums text-slate-700">{Number(item.quantity)} ADET</td>
                      <td className="p-4 text-right font-bold tabular-nums text-slate-600">{new Decimal(item.price || 0).toNumber().toLocaleString('tr-TR')} ₺</td>
                      <td className="p-4 text-right font-black tabular-nums text-slate-900">{new Decimal(item.lineTotal || 0).toNumber().toLocaleString('tr-TR')} ₺</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* STEP 2: PHYSICAL WAREHOUSE RESERVATION (SPLIT ALLOCATION) */}
        {step === 2 && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col gap-6 text-left animate-in fade-in duration-300">
            
            {/* Global Depot Selection (Quick Assignment) */}
            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Hızlı Toplu Depo Atama</h4>
                <p className="text-[11px] text-slate-400 font-bold">Tüm sipariş kalemlerini tek tuşla seçtiğiniz çıkış deposuna atayabilirsiniz.</p>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  className="h-10 px-4 text-xs font-black bg-white border border-slate-200 rounded-xl"
                  value={globalDeptId}
                  onChange={e => setGlobalDeptId(e.target.value)}
                >
                  <option value="">-- DEPO SEÇİN --</option>
                  {activePhysicalDepts.map(d => <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>)}
                </select>
                <button
                  type="button"
                  onClick={handleGlobalApply}
                  disabled={!globalDeptId}
                  className="bg-primary text-white h-10 px-5 text-xs font-black rounded-xl hover:brightness-110 active:scale-95 transition-all"
                >
                  UYGULA
                </button>
              </div>
            </div>

            {/* Split Allocations Table */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-black text-slate-600 uppercase tracking-widest text-[10px]">Ürün & Kod</th>
                    <th className="p-4 font-black text-slate-600 uppercase tracking-widest text-[10px] text-center w-[120px]">Sipariş Miktarı</th>
                    <th className="p-4 font-black text-slate-600 uppercase tracking-widest text-[10px] w-[60%]">Çıkış Depoları (Split Allocation)</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items?.map((item: SaleItem) => {
                    const itemAllocations = allocations[item.itemId] || [];
                    const itemError = validationErrors[item.itemId];
                    const totalQty = Number(item.quantity);

                    return (
                      <tr key={item.itemId} className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                        <td className="p-4 align-top text-left">
                          <div className="font-extrabold text-slate-800 text-sm">{item.item?.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold tracking-wider mt-1">{item.item?.code}</div>
                        </td>
                        <td className="p-4 align-top text-center">
                          <span className="inline-block bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl font-black text-sm tabular-nums">
                            {totalQty}
                          </span>
                        </td>
                        <td className="p-4">
                          
                          {/* Multi-depot split rows */}
                          <div className="space-y-2">
                            {itemAllocations.map((row, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <select
                                  required
                                  className="h-9 px-3 text-xs font-black flex-1 bg-white border border-slate-200 rounded-xl cursor-pointer"
                                  value={row.departmentId}
                                  onChange={e => handleUpdateRow(item.itemId, idx, 'departmentId', e.target.value)}
                                >
                                  <option value="">-- DEPO SEÇİN --</option>
                                  {activePhysicalDepts.map(d => <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>)}
                                </select>
                                
                                <div className="relative w-36">
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    className="h-9 px-3 pr-8 text-xs font-black tabular-nums w-full border border-slate-200 rounded-xl"
                                    placeholder="Miktar"
                                    value={row.quantity === null || row.quantity === undefined ? '' : row.quantity}
                                    onKeyDown={(e) => {
                                      if (['e', 'E', '+', '-'].includes(e.key)) {
                                        e.preventDefault();
                                      }
                                    }}
                                    onChange={e => handleUpdateRow(item.itemId, idx, 'quantity', e.target.value)}
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">ADET</span>
                                </div>

                                {itemAllocations.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRow(item.itemId, idx)}
                                    className="w-9 h-9 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl border border-rose-100"
                                  >
                                    <FiTrash size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2">
                            <button
                              type="button"
                              onClick={() => handleAddRow(item.itemId)}
                              className="text-[10px] font-black text-primary hover:text-primary/80 flex items-center gap-1 uppercase tracking-widest"
                            >
                              <FiPlus size={12} /> Yeni Depo Ekle (Split)
                            </button>

                            {itemError && (
                              <div className="flex items-center gap-1 text-[10px] text-rose-500 font-extrabold bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg">
                                <FiAlertTriangle size={12} /> {itemError}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Footer Navigation Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 sm:px-8 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl shrink-0">
          <div>
            {step === 2 && (
              isValid ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-black bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl">
                  <FiCheck size={16} /> Depo dağılımları eksiksiz ve uyumlu!
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-rose-500 font-black bg-rose-50 border border-rose-100 px-4 py-2 rounded-2xl">
                  <FiAlertTriangle size={16} /> Miktar dağılımlarında uyuşmazlık var!
                </span>
              )
            )}
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            {step > 1 && (
              <button 
                type="button" 
                onClick={() => setStep(step - 1)}
                className="h-12 px-6 bg-slate-100 text-slate-650 hover:bg-slate-200 text-xs font-black rounded-2xl flex items-center gap-2 transition-all"
              >
                <FiArrowLeft size={16} /> Geri Dön
              </button>
            )}
            
            {step < 2 ? (
              <button 
                type="button" 
                onClick={() => {
                  setStep(step + 1);
                }}
                className="h-12 px-8 bg-primary text-white hover:brightness-110 text-xs font-black rounded-2xl flex items-center gap-2 hover:scale-[1.02] transition-all"
              >
                İleri Devam <FiArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={!isValid}
                onClick={handleConfirm}
                className={`h-12 px-8 text-xs font-black rounded-2xl flex items-center gap-2 transition-all ${
                  isValid 
                    ? 'bg-emerald-600 text-white hover:brightness-110 hover:scale-[1.02] shadow-lg shadow-emerald-600/25' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <FiCheck size={16} strokeWidth={3} /> SİPARİŞİ ONAYLA
              </button>
            )}
            
            <button 
              type="button" 
              onClick={onClose}
              className="h-12 px-6 bg-slate-150 text-slate-500 hover:bg-slate-200 text-xs font-black rounded-2xl transition-all"
            >
              Kapat
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
