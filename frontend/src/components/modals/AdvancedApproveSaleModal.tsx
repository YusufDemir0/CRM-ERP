import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash, FiCheck, FiAlertTriangle, FiCreditCard } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { Sale, SaleItem, Department, Account } from '../../types';
import { accountsAPI } from '../../services/api';
import { formatDisplayDate } from '../../utils/date.helper';

interface AdvancedApproveSaleModalProps {
  sale: Sale;
  departments: Department[];
  onSubmit: (allocations: Array<{ itemId: string; departmentId: string; quantity: number }>, commercialAccountId?: string) => void;
  onClose: () => void;
}

interface Allocation {
  departmentId: string;
  quantity: number;
}

export const AdvancedApproveSaleModal: React.FC<AdvancedApproveSaleModalProps> = ({
  sale,
  departments,
  onSubmit,
  onClose,
}) => {
  const activeDepts = departments.filter(d => d.state === 1);
  const defaultDeptId = activeDepts[0]?.id ? String(activeDepts[0].id) : '';

  // State to hold allocations for each line item (keyed by itemId)
  const [allocations, setAllocations] = useState<Record<string, Allocation[]>>({});
  
  // State for global warehouse select
  const [globalDeptId, setGlobalDeptId] = useState<string>(defaultDeptId);

  // Commercial account selection
  const [selectedAccountId, setSelectedAccountId] = useState<string>((sale as any).commercialAccountId ? String((sale as any).commercialAccountId) : '');

  const { data: accountsData } = useQuery({
    queryKey: ['accounts', 'active-list'],
    queryFn: async () => {
      const res = await accountsAPI.getAll({ state: 1, limit: 100 });
      return res.data?.data || [];
    },
  });

  // State for local warehouse select of each item
  const [localDeptIds, setLocalDeptIds] = useState<Record<string, string>>({});

  // Initialize allocations on open
  useEffect(() => {
    const initialAllocations: Record<string, Allocation[]> = {};
    const initialLocals: Record<string, string> = {};

    sale.items?.forEach(item => {
      initialAllocations[item.itemId] = [
        { departmentId: defaultDeptId, quantity: Number(item.quantity) }
      ];
      initialLocals[item.itemId] = defaultDeptId;
    });

    setAllocations(initialAllocations);
    setLocalDeptIds(initialLocals);
  }, [sale, defaultDeptId]);

  // Global apply handler
  const handleGlobalApply = () => {
    if (!globalDeptId) return;
    const nextAllocations = { ...allocations };
    sale.items?.forEach(item => {
      nextAllocations[item.itemId] = [
        { departmentId: globalDeptId, quantity: Number(item.quantity) }
      ];
    });
    setAllocations(nextAllocations);

    // Sync local select boxes too
    const nextLocals = { ...localDeptIds };
    sale.items?.forEach(item => {
      nextLocals[item.itemId] = globalDeptId;
    });
    setLocalDeptIds(nextLocals);
  };

  // Local apply handler for a specific line item
  const handleLocalApply = (itemId: string, totalQty: number) => {
    const targetDeptId = localDeptIds[itemId];
    if (!targetDeptId) return;

    setAllocations(prev => ({
      ...prev,
      [itemId]: [
        { departmentId: targetDeptId, quantity: totalQty }
      ]
    }));
  };

  // Add allocation row for a specific item
  const handleAddRow = (itemId: string) => {
    setAllocations(prev => {
      const currentList = prev[itemId] || [];
      return {
        ...prev,
        [itemId]: [...currentList, { departmentId: globalDeptId || defaultDeptId, quantity: 0 }]
      };
    });
  };

  // Remove allocation row
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

  // Update field of an allocation row
  const handleUpdateRow = (itemId: string, index: number, field: keyof Allocation, value: any) => {
    setAllocations(prev => {
      const currentList = [...(prev[itemId] || [])];
      currentList[index] = {
        ...currentList[index],
        [field]: field === 'quantity' ? Number(value) : value
      };
      return {
        ...prev,
        [itemId]: currentList
      };
    });
  };

  // Validation logic
  const checkValidation = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    let isValid = true;

    sale.items?.forEach(item => {
      const itemAllocations = allocations[item.itemId] || [];
      const sum = itemAllocations.reduce((acc, curr) => acc + curr.quantity, 0);
      const total = Number(item.quantity);

      if (Math.abs(sum - total) > 0.0001) {
        errors[item.itemId] = `Miktar uyuşmuyor! Toplam seçilen: ${sum}, Gerekli: ${total}`;
        isValid = false;
      }

      // Check if any row has an empty or invalid departmentId
      const hasEmptyDept = itemAllocations.some(row => !row.departmentId);
      if (hasEmptyDept) {
        errors[item.itemId] = `Lütfen tüm satırlar için depo seçiniz.`;
        isValid = false;
      }
    });

    return { isValid, errors };
  };

  const { isValid, errors: validationErrors } = checkValidation();

  const handleConfirm = () => {
    if (!isValid) return;

    // Flatten allocations state to array
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
    <div className="loader-overlay items-start pt-[5%] pb-[5%] overflow-y-auto z-[100]">
      <div className="login-box !max-w-[1400px] w-[95%] relative bg-white border border-slate-200/80 shadow-2xl rounded-3xl p-6 text-slate-800">
        <button className="btn-icon circle absolute top-6 right-6 hover:bg-slate-100 transition-colors" onClick={onClose}>
          <FiX size={20}/>
        </button>
        <h3 className="text-[var(--primary)] font-black text-xl mb-1 uppercase tracking-tight">Gelişmiş Sipariş Onay & Depo Rezervasyonu</h3>
        <p className="text-xs text-gray-500 mb-6">
          Sipariş No: <strong className="text-slate-800">{sale.code}</strong> | Tarih: {formatDisplayDate(sale.createdAt)}
        </p>

        {/* TOP LEVEL GLOBAL CONTROLS */}
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 text-left">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Hızlı Genel Atama</h4>
            <p className="text-[11px] text-slate-400 font-bold">Aşağıdaki seçtiğiniz depoyu tek tuşla tüm sipariş kalemlerinin çıkış deposu olarak belirleyebilirsiniz.</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              className="input-premium font-black !h-10 !py-0 !px-4 text-xs bg-white border border-slate-200 rounded-xl"
              value={globalDeptId}
              onChange={e => setGlobalDeptId(e.target.value)}
            >
              <option value="">-- GENEL DEPO SEÇİN --</option>
              {activeDepts.map(d => <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>)}
            </select>
            <button
              type="button"
              onClick={handleGlobalApply}
              disabled={!globalDeptId}
              className="btn bg-[var(--primary)] text-white h-10 px-5 text-xs font-black rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
            >
              GENEL DEPOYU UYGULA
            </button>
          </div>
        </div>

        {/* HESAP SEÇİMİ */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 p-4 rounded-2xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <FiCreditCard size={18} />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Tahsilat Hesabı</h4>
              <p className="text-[11px] text-slate-400 font-bold">Satış tutarının yatırılacağı kasa veya banka hesabını seçiniz.</p>
            </div>
          </div>
          <select 
            className="input-premium font-black !h-10 !py-0 !px-4 text-xs bg-white border border-blue-200 rounded-xl min-w-[280px]"
            value={selectedAccountId}
            onChange={e => setSelectedAccountId(e.target.value)}
          >
            <option value="">-- HESAP SEÇİN --</option>
            {(accountsData || []).map((acc: Account) => (
              <option key={acc.id} value={acc.id}>
                {acc.name.toUpperCase()} {acc.bankName ? `(${acc.bankName})` : '(NAKİT KASA)'}
              </option>
            ))}
          </select>
        </div>

        {/* SEPET VE DEPO SEÇİM TABLOSU */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden mb-6 bg-white">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-black text-slate-600 uppercase tracking-widest text-[10px]">Ürün & Kod</th>
                <th className="p-4 font-black text-slate-600 uppercase tracking-widest text-[10px] text-center w-[120px]">Sipariş Miktarı</th>
                <th className="p-4 font-black text-slate-600 uppercase tracking-widest text-[10px] w-[60%]">Depo Allocation (Dağılım) Detayları</th>
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
                      {/* LOCAL APPLY CONTROL */}
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hızlı Kalem Deposu:</span>
                        <select 
                          className="input-premium font-black !h-8 !py-0 !px-3 text-[11px] max-w-[200px] border border-slate-200 rounded-lg"
                          value={localDeptIds[item.itemId] || ''}
                          onChange={e => setLocalDeptIds(prev => ({ ...prev, [item.itemId]: e.target.value }))}
                        >
                          <option value="">-- DEPO SEÇİN --</option>
                          {activeDepts.map(d => <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleLocalApply(item.itemId, totalQty)}
                          disabled={!localDeptIds[item.itemId]}
                          className="px-3 h-8 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] rounded-lg transition-all"
                        >
                          UYGULA
                        </button>
                      </div>

                      {/* SPLIT ALLOCATIONS LIST */}
                      <div className="space-y-2">
                        {itemAllocations.map((row, idx) => (
                          <div key={idx} className="flex items-center gap-3 animate-in fade-in duration-200">
                            <select
                              required
                              className="input-premium font-black !h-9 text-xs flex-1 bg-white border border-slate-200 rounded-xl"
                              value={row.departmentId}
                              onChange={e => handleUpdateRow(item.itemId, idx, 'departmentId', e.target.value)}
                            >
                              <option value="">-- DEPO SEÇİN --</option>
                              {activeDepts.map(d => <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>)}
                            </select>
                            
                            <div className="relative w-36">
                              <input
                                type="number"
                                min="0.0001"
                                step="any"
                                className="input-premium !h-9 text-xs font-black tabular-nums w-full pr-8 border border-slate-200 rounded-xl"
                                placeholder="Miktar"
                                value={row.quantity || ''}
                                onChange={e => handleUpdateRow(item.itemId, idx, 'quantity', e.target.value)}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">ADET</span>
                            </div>

                            {itemAllocations.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(item.itemId, idx)}
                                className="w-9 h-9 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-colors border border-rose-100"
                                title="Satırı Sil"
                              >
                                <FiTrash size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* ADD ROW & ERROR LOGICS */}
                      <div className="flex items-center justify-between mt-3 pt-2">
                        <button
                          type="button"
                          onClick={() => handleAddRow(item.itemId)}
                          className="text-[10px] font-black text-primary hover:text-primary/80 flex items-center gap-1 transition-colors uppercase tracking-widest"
                        >
                          <FiPlus size={12} /> Yeni Depo Çıkışı Ekle (Split)
                        </button>

                        {itemError && (
                          <div className="flex items-center gap-1 text-[10px] text-rose-500 font-extrabold bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg animate-pulse">
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

        {/* MODAL FOOTER ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {!isValid && (
              <span className="flex items-center gap-1.5 text-xs text-rose-500 font-black bg-rose-50 border border-rose-100 px-4 py-2 rounded-2xl">
                <FiAlertTriangle size={16} /> LÜTFEN TÜM MİKTAR DAĞILIMLARINI EKSİKSİZ VE UYUMLU ŞEKİLDE DÜZENLEYİNİZ!
              </span>
            )}
            {isValid && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-black bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl">
                <FiCheck size={16} /> TÜM MİKTAR DAĞILIMLARI DOĞRU VE ONAYLANMAYA HAZIR!
              </span>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={!isValid}
              onClick={handleConfirm}
              className={`btn btn-lg px-8 font-black text-xs rounded-xl flex items-center gap-2 transition-all ${
                isValid 
                  ? 'bg-[var(--success)] text-white hover:brightness-110 shadow-lg hover:scale-[1.02] active:scale-[0.98]' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              <FiCheck size={16} strokeWidth={3} />
              DAĞILIMI KAYDET & SATIŞI ONAYLA
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn bg-slate-100 text-slate-600 btn-lg px-6 font-black text-xs hover:bg-slate-200 transition-all rounded-xl border border-slate-200"
            >
              İPTAL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
