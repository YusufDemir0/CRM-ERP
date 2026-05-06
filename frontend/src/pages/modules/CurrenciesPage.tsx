import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { currenciesAPI } from '../../services/api';
import { 
  FiX, FiStar, FiEdit2, FiPlus, FiFilter, 
  FiDollarSign, FiGlobe, FiTrendingUp, FiCheckCircle
} from 'react-icons/fi';
import { Currency } from '../../types';
import toast from 'react-hot-toast';
import { Decimal } from 'decimal.js';
import { DataTable, Column } from '../../components/common/DataTable';
import { useSort } from '../../hooks/useSort';
import { queryKeys } from '../../services/queryKeys';

export function CurrenciesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState({ code: '', name: '', symbol: '', exchangeRate: 1, isDefault: 0 });

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 20;
  const sort = {
    key: searchParams.get('sortBy') || 'isDefault',
    order: (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC'
  };

  const updateParams = (newParams: Record<string, string | number | undefined>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === '' || (key === 'page' && value === 1)) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });
      return next;
    }, { replace: true });
  };

  const { data: currenciesData, isLoading: loading } = useQuery({
    queryKey: queryKeys.currencies.allWithParams({ page, limit, sort }),
    queryFn: async () => {
      const res = await currenciesAPI.getAll({ 
        page, limit, 
        sortBy: sort.key, sortOrder: sort.order 
      });
      return res.data;
    }
  });

  const currencies = currenciesData?.data || [];
  const paginationMeta = currenciesData?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 };
  
  const { sortedData, sortConfigs, toggleSort } = useSort<Currency>(
    currencies, 
    [{ key: sort.key, direction: sort.order.toLowerCase() as 'asc' | 'desc' }],
    (configs) => {
      if (configs.length > 0) {
        updateParams({ 
          sortBy: configs[0].key, 
          sortOrder: configs[0].direction.toUpperCase(),
          page: 1 
        });
      }
    }
  );

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number | null; data: Partial<Currency> }) => {
      if (id) return currenciesAPI.update(id, data);
      return currenciesAPI.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.all });
      setIsModalOpen(false);
      toast.success(editingId ? "Güncellendi" : "Kaydedildi");
    },
    onError: () => toast.error("Hata oluştu")
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      exchangeRate: new Decimal(formData.exchangeRate).toString(),
      isDefault: Number(formData.isDefault)
    };
    mutation.mutate({ id: editingId, data: payload });
  };

  const handleEdit = (c: Currency) => {
    setEditingId(c.id);
    setFormData({ code: c.code, name: c.name, symbol: c.symbol, exchangeRate: Number(c.exchangeRate), isDefault: c.isDefault || 0 });
    setIsModalOpen(true);
  };

  const columns: Column<Currency>[] = [
    { 
      header: 'PARA BİRİMİ', 
      accessor: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-glow)] flex items-center justify-center text-[var(--primary)] text-lg">
            <FiDollarSign />
          </div>
          <div>
            <div className="font-extrabold text-[var(--on-surface)] text-sm">{c.name}</div>
            <div className="flex gap-1.5 items-center">
              <span className="text-[10px] font-black text-[var(--text-muted)]">{c.code}</span>
              {c.isDefault === 1 && (
                <span className="text-[9px] font-black text-[var(--success)] inline-flex items-center gap-0.5">
                  • <FiStar size={8} /> ANA BİRİM
                </span>
              )}
            </div>
          </div>
        </div>
      ),
      sortKey: 'code'
    },
    { 
      header: 'SEMBOL', 
      accessor: (c) => (
        <div className="py-1 px-3 rounded-lg bg-[var(--surface-container)] text-[var(--on-surface)] text-[13px] font-black">
          {c.symbol}
        </div>
      ),
      sortKey: 'symbol'
    },
    { 
      header: 'GÜNCEL KUR (1 Birim)', 
      className: 'text-right',
      accessor: (c) => (
        <div className="text-right flex flex-col items-end">
          <span className="tabular-nums font-black text-[15px] text-[var(--primary)] tracking-tight">
            {new Decimal(c.exchangeRate || 0).toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} ₺
          </span>
          <span className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase">
            MB KUR KARŞILIĞI
          </span>
        </div>
      ),
      sortKey: 'exchangeRate'
    }
  ];

  return (
    <div className="animate-in flex flex-col gap-8">
      
      {/* 🔴 HEADER SECTION */}
      <div className="flex justify-between items-end">
        <div>
          <div className="inline-flex items-center gap-2 bg-[var(--primary-glow)] text-[var(--primary)] px-3.5 py-1.5 rounded-xl text-xs font-extrabold mb-4">
            <FiTrendingUp /> EKONOMİK TANIMLAMALAR
          </div>
          <h1 className="text-[2rem] font-black tracking-tighter text-[var(--on-surface)]">
            Para Birimleri <span className="text-[var(--primary)]">& Kurlar</span>
          </h1>
        </div>
        
        <button className="btn btn-primary h-11 shadow-lg shadow-[var(--primary-glow)]" onClick={() => {
          setEditingId(null); 
          setFormData({ code: '', name: '', symbol: '', exchangeRate: 1, isDefault: 0 }); 
          setIsModalOpen(true);
        }}>
          <FiPlus size={18} /> Yeni Birim Tanımla
        </button>
      </div>

      {/* 🟡 DATA TABLE SECTION */}
      <div className="flex flex-col gap-4">
        <DataTable<Currency>
          data={sortedData}
          columns={columns}
          isLoading={loading}
          sortConfigs={sortConfigs}
          onSort={toggleSort}
          getRowKey={(c) => c.id}
          onEdit={handleEdit}
        />
      </div>

      {/* 🟢 MODAL SECTION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white max-w-[500px] w-full p-6 rounded-2xl shadow-premium-lg border border-slate-100 flex flex-col gap-8 animate-in zoom-in-95 duration-300 relative">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {editingId ? 'Birim Güncelle' : 'Yeni Para Birimi'}
              </h2>
              <button 
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 transition-colors" 
                onClick={() => setIsModalOpen(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">DÖVİZ KODU</label>
                  <input 
                    required 
                    className="h-14 px-5 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors uppercase" 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value.toLocaleUpperCase('tr-TR')})} 
                    placeholder="USD" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">SEMBOL</label>
                  <input 
                    required 
                    className="h-14 px-5 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors" 
                    value={formData.symbol} 
                    onChange={e => setFormData({...formData, symbol: e.target.value})} 
                    placeholder="$" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">BİRİM ADI</label>
                <input 
                  required 
                  className="h-14 px-5 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors uppercase" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value.toLocaleUpperCase('tr-TR')})} 
                  placeholder="AMERİKAN DOLARI" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">KUR DEĞERİ (1 Birim = X TL)</label>
                <input 
                  type="number" 
                  step="0.0001" 
                  required 
                  value={formData.exchangeRate} 
                  onChange={e => setFormData({...formData, exchangeRate: Number(e.target.value)})} 
                  disabled={formData.isDefault === 1} 
                  className="h-16 px-6 rounded-2xl border-2 border-primary/20 bg-primary/5 font-black text-2xl text-center text-primary tabular-nums transition-colors outline-none focus:border-primary/40 disabled:opacity-50 disabled:bg-slate-50 disabled:border-slate-100 disabled:text-slate-400" 
                />
              </div>
              
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 border-dashed flex items-center gap-4 group cursor-pointer" onClick={() => {
                if(formData.isDefault !== 1) {
                  setFormData({...formData, isDefault: 1, exchangeRate: 1});
                } else {
                  setFormData({...formData, isDefault: 0});
                }
              }}>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                  formData.isDefault === 1 ? 'bg-primary border-primary text-white' : 'border-slate-200 bg-white group-hover:border-primary/50'
                }`}>
                  {formData.isDefault === 1 && <FiCheckCircle size={14} />}
                </div>
                <label className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                  Sistem Ana Para Birimi Olarak Ayarla
                </label>
              </div>

              <div className="flex gap-4 mt-2">
                <button type="submit" className="flex-1 h-16 rounded-2xl bg-primary text-white font-black text-base shadow-xl shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-colors">
                  {editingId ? 'DEĞİŞİKLİKLERİ KAYDET' : 'PARA BİRİMİNİ EKLE'}
                </button>
                <button type="button" className="flex-[0.4] h-16 rounded-2xl bg-slate-50 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-colors" onClick={() => setIsModalOpen(false)}>
                  VAZGEÇ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}