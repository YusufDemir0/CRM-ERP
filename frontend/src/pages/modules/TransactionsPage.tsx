import { useState, useDeferredValue, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsAPI, partiesAPI, accountsAPI, currenciesAPI, departmentsAPI, salesAPI } from '../../services/api';
import { 
  FiArrowUpRight, FiArrowDownLeft, FiRepeat, 
  FiCreditCard, FiPlus, FiX, FiActivity, FiFilter
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { formatDisplayDate, getTodayString } from '../../utils/date.helper';
import { queryKeys } from '../../services/queryKeys';
import { Transaction, Party, Account, Currency, CreateTransactionDto } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Decimal } from 'decimal.js';
import { useSort } from '../../hooks/useSort';
import { PremiumNumberInput } from '../../components/common/PremiumNumberInput';
import { useAuth } from '../../hooks/useAuth';
import TransferFundsModal from '../../components/modals/TransferFundsModal';
import { SearchableSelect } from '../../components/common/SearchableSelect';

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isSystemAdmin = user?.roles?.includes('Admin') || false;
  
  const page = Number(searchParams.get('page')) || 1;
  const searchTerm = searchParams.get('q') || '';
  const limit = Number(searchParams.get('limit')) || 20;
  
  const sort = {
    key: searchParams.get('sortBy') || 'date',
    order: (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC'
  };

  const [filters] = useState<Record<string, string | number | undefined>>({});
  const deferredSearch = useDeferredValue(searchTerm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    type: 'in' as 'in' | 'out', 
    partyId: '',
    commercialAccountId: '',
    amount: 0,
    date: getTodayString(),
    description: '',
    referenceType: '',
    referenceId: '',
    currencyId: '',
  });

  const { data: salesData } = useQuery({
    queryKey: ['sales', 'lookup', formData.partyId],
    queryFn: async () => {
      if (!formData.partyId) return [];
      const res = await salesAPI.getAll({ partyId: formData.partyId, limit: 100 });
      return res.data?.data || [];
    },
    enabled: !!formData.partyId && formData.referenceType === 'sale',
  });

  const updateParams = useCallback((newParams: Record<string, string | number | undefined>) => {
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
  }, [setSearchParams]);

  const setPage = (p: number) => updateParams({ page: p });
  const setSearchTerm = (q: string) => updateParams({ q, page: 1 });
  const setSort = (key: string, order: 'ASC' | 'DESC') => updateParams({ sortBy: key, sortOrder: order, page: 1 });

  // ────── QUERIES ──────

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: queryKeys.transactions.all({ page, limit, deferredSearch, sort, filters: { ...filters, commercialAccountId: selectedAccountId, departmentId: selectedDeptId } }),
    queryFn: async ({ signal }) => {
      const res = await transactionsAPI.getAll({
        page,
        limit,
        search: deferredSearch,
        sortBy: sort.key,
        sortOrder: sort.order,
        commercialAccountId: selectedAccountId || undefined,
        departmentId: selectedDeptId || undefined,
        ...filters
      }, { signal });
      return res.data;
    }
  });

  const transactions = txData?.data || [];
  const paginationMeta = txData?.meta;
  const loading = txLoading;

  const { sortedData, sortConfigs, toggleSort } = useSort<Transaction>(
    transactions, 
    [{ key: sort.key, direction: sort.order.toLowerCase() as 'asc' | 'desc' }],
    (configs) => {
      if (configs.length > 0) {
        setSort(
          configs[0].key, 
          configs[0].direction.toUpperCase() as 'ASC' | 'DESC' 
        );
      }
    }
  );

  // ────── ADDITIONAL LOOKUPS ──────
  const { data: parties = [] } = useQuery({
    queryKey: queryKeys.parties.lookup,
    queryFn: async ({ signal }) => {
      const res = await partiesAPI.getAll({ state: 1, limit: 1000 }, { signal });
      return res.data.data;
    }
  });

  const { data: accounts = [] } = useQuery({
    queryKey: queryKeys.accounts.lookup,
    queryFn: async ({ signal }) => {
      const res = await accountsAPI.getAll({ state: 1, limit: 100 }, { signal });
      return res.data.data;
    }
  });

  const { data: currencies = [] } = useQuery({
    queryKey: queryKeys.currencies.all,
    queryFn: async ({ signal }) => {
      const res = await currenciesAPI.getAll({ limit: 500 }, { signal });
      return res.data.data || [];
    }
  });

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments.active,
    queryFn: async ({ signal }) => {
      const res = await departmentsAPI.getAll({ limit: 100 }, { signal });
      return res.data.data.filter((d: any) => d.state === 1);
    }
  });

  const partyOptions = useMemo(() => {
    return parties.map((p: Party) => {
      const balance = new Decimal(p.balance || 0);
      return {
        id: String(p.id),
        label: `${p.name} [${balance.toNumber().toLocaleString('tr-TR')} ${p.currency?.symbol || ''}]`
      };
    });
  }, [parties]);

  const accountOptions = useMemo(() => {
    return accounts.map((a: Account) => ({
      id: String(a.id),
      label: `${a.name} [${a.bankName || 'Kasa'}]`
    }));
  }, [accounts]);

  const departmentOptions = useMemo(() => {
    return departments.map((d: any) => ({
      id: String(d.id),
      label: d.name.toUpperCase()
    }));
  }, [departments]);

  const transferMutation = useMutation({
    mutationFn: (data: { fromAccountId: string; toAccountId: string; amount: string; currencyId?: string; date: string; description?: string }) => 
      transactionsAPI.transfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setIsTransferModalOpen(false);
      toast.success("Kasa transferi başarıyla gerçekleştirildi.");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Transfer işlemi sırasında bir hata oluştu.";
      toast.error(msg);
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTransactionDto) => transactionsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      setIsModalOpen(false);
      toast.success("Tahsilat/Ödeme başarıyla kaydedildi.");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "İşlem kaydedilirken bir hata oluştu.";
      toast.error(msg);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string | number) => transactionsAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast.success("İşlem başarıyla iptal edildi.");
    },
    onError: () => toast.error("İşlem iptal edilirken bir hata oluştu.")
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partyId || !formData.commercialAccountId || formData.amount <= 0) {
      toast.error("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    
    createMutation.mutate({
      ...formData,
      partyId: formData.partyId,
      commercialAccountId: formData.commercialAccountId,
      amount: new Decimal(formData.amount).toFixed(2),
      currencyId: formData.currencyId,
      referenceId: formData.referenceId || undefined,
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ type: 'in', partyId: '', commercialAccountId: '', amount: 0, date: getTodayString(), description: '', referenceType: '', referenceId: '', currencyId: '' });
  };

  const handleCancelTransaction = async (id: string | number) => {
    const confirmed = await confirmDialog("Bu işlemi iptal etmek (ters kayıt oluşturmak) istediğinize emin misiniz?", true);
    if (confirmed) {
      cancelMutation.mutate(id);
    }
  };

  const columns: Column<Transaction>[] = [
    { 
      header: 'İŞLEM / CARİ HESAP', 
      accessor: (tx) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
            tx.type === 'in' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          }`}>
            {tx.type === 'in' ? <FiArrowDownLeft /> : <FiArrowUpRight />}
          </div>
          <div>
            <div className="font-black text-on-surface text-sm">{tx.party?.name || 'BELİRSİZ CARİ'}</div>
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">{tx.code} • {formatDisplayDate(tx.date)}</div>
          </div>
        </div>
      ),
      sortKey: 'code'
    },
    { 
      header: 'KASA / BANKA HESABI', 
      accessor: (tx) => (
        <div className="flex items-center gap-2">
          <FiCreditCard className="text-primary text-sm" />
          <span className="font-bold text-xs sm:text-sm text-on-surface-variant">{tx.commercialAccount?.name}</span>
        </div>
      ),
      sortKey: 'commercialAccount.name'
    },
    { 
      header: 'FİNANSAL TUTAR', 
      accessor: (tx) => {
        const amount = new Decimal(tx.amount || 0);
        return (
          <div className="text-right flex flex-col items-end">
            <span className={`tabular-nums font-black text-base tracking-tighter ${
              tx.type === 'in' ? 'text-success' : 'text-danger'
            }`}>
              {tx.type === 'in' ? '+' : '-'}{amount.toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {tx.currency?.symbol || '₺'}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${
              tx.type === 'in' ? 'text-success' : 'text-danger'
            }`}>
              {tx.type === 'in' ? 'TAHSİLAT' : 'ÖDEME'}
            </span>
          </div>
        );
      },
      sortKey: 'amount',
      className: 'text-right'
    },
    { 
      header: 'DURUM', 
      accessor: (tx) => (
        <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${
          tx.status === 'completed' ? 'bg-surface-container text-slate-400' : 'bg-danger/10 text-danger'
        }`}>
          {tx.status === 'completed' ? 'TAMAMLANDI' : 'İPTAL EDİLDİ'}
        </span>
      ),
      sortKey: 'status'
    }
  ];

  return (
    <div className="animate-in flex flex-col gap-8">
      
      {/* 🔴 HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <FiRepeat /> NAKİT AKIŞI & FİNANS LOGU
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-on-surface">
            Kasa & <span className="text-primary">Banka Hareketleri</span>
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            className={`h-12 px-5 rounded-2xl font-black text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all ${
              showFilters 
                ? 'bg-slate-800 text-white shadow-md' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`} 
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter size={16} /> 
            {showFilters ? 'FİLTRELERİ KAPAT' : 'FİLTRELE'}
            {(selectedAccountId || selectedDeptId) && (
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center animate-bounce">
                {Number(!!selectedAccountId) + Number(!!selectedDeptId)}
              </span>
            )}
          </button>

          <button 
            className="h-12 px-5 bg-indigo-50 hover:bg-indigo-100 text-[var(--primary)] rounded-2xl font-black text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all" 
            onClick={() => setIsTransferModalOpen(true)}
          >
            <FiRepeat size={16} /> Kasa Transferi Yap
          </button>

          <button className="h-12 px-6 bg-[var(--primary)] hover:brightness-110 text-white rounded-2xl font-black text-sm shadow-premium flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all" onClick={() => {
            const defaultCur = currencies.find((c: Currency) => c.isDefault === 1);
            setFormData({ 
              type: 'in', partyId: '', commercialAccountId: '', amount: 0, 
              date: getTodayString(), description: '', referenceType: '', 
              referenceId: '', currencyId: String(defaultCur?.id || '') 
            });
            setIsModalOpen(true);
          }}>
            <FiPlus size={20} /> Tahsilat / Ödeme Ekle
          </button>
        </div>
      </div>

      {/* 🔍 FILTERS BAR */}
      {showFilters && (
        <div className="flex flex-col md:flex-row gap-6 bg-white p-6 border border-slate-100 shadow-premium rounded-2xl animate-in slide-in-from-top duration-300">
          <div className="flex-1">
            <SearchableSelect
              label="Kasa / Banka Hesabı"
              options={accountOptions}
              value={selectedAccountId}
              onChange={(opt) => setSelectedAccountId(opt ? String(opt.id) : '')}
              placeholder="Tüm Kasalar..."
            />
          </div>

          {isSystemAdmin && (
            <div className="flex-1">
              <SearchableSelect
                label="Departman / Mağaza"
                options={departmentOptions}
                value={selectedDeptId}
                onChange={(opt) => setSelectedDeptId(opt ? String(opt.id) : '')}
                placeholder="Tüm Mağazalar..."
              />
            </div>
          )}

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setSelectedAccountId('');
                setSelectedDeptId('');
              }}
              disabled={!selectedAccountId && !selectedDeptId}
              className="h-12 px-6 bg-slate-50 text-slate-400 border border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-400 transition-colors w-full md:w-auto"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <DataTable<Transaction>
          data={sortedData}
          columns={columns}
          isLoading={loading}
          sortConfigs={sortConfigs}
          onSort={toggleSort}
          getRowKey={(tx) => tx.id}
          
          // Integrated Search & Pagination
          search={searchTerm}
          onSearchChange={setSearchTerm}
          total={paginationMeta?.total || 0}
          page={page}
          limit={limit}
          onPageChange={setPage}
          placeholder="İşlem no, cari adı veya açıklama ile ara..."
        />
      </div>

      {/* 🟢 TRANSACTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-slate-900/60 animate-in fade-in duration-200">
          <div className="bg-white max-w-[600px] w-full p-6 rounded-2xl shadow-2xl border border-slate-100 flex flex-col gap-8 animate-in zoom-in-95 duration-300 text-slate-800">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Finansal Hareket Ekle</h2>
              <button className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-450 hover:text-red-500 transition-colors" onClick={handleCloseModal}>
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">İŞLEM TİPİ</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value as 'in'|'out'})}
                    className="h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer"
                  >
                    <option value="in">Tahsilat (Para Girişi)</option>
                    <option value="out">Ödeme (Para Çıkışı)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">İŞLEM TARİHİ</label>
                  <input 
                    type="date" 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    onKeyDown={(e) => e.preventDefault()}
                    className="h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors"
                  />
                </div>
              </div>

              <SearchableSelect
                label="CARİ HESAP"
                required
                options={partyOptions}
                value={formData.partyId}
                onChange={(opt) => setFormData(prev => ({ ...prev, partyId: opt ? String(opt.id) : '', referenceId: '' }))}
                placeholder="Cari seçin..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">İŞLEM KATEGORİSİ</label>
                  <select
                    value={formData.referenceType || 'manual'}
                    onChange={e => setFormData({ ...formData, referenceType: e.target.value, referenceId: '' })}
                    className="h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer"
                  >
                    <option value="manual">Cari Tahsilatı / Ödemesi</option>
                    <option value="sale">Satıştan Tahsilat / Ödeme</option>
                  </select>
                </div>

                {formData.referenceType === 'sale' && (
                  <div className="flex flex-col gap-2 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">İLİŞKİLİ SATIŞ / SİPARİŞ</label>
                    <select
                      value={formData.referenceId}
                      onChange={e => setFormData({ ...formData, referenceId: e.target.value })}
                      className="h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer"
                    >
                      <option value="">Seçiniz...</option>
                      {(salesData || []).map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.code} ({s.grandTotal} {s.currency?.symbol || '₺'} - Kalan: {(s.grandTotal - s.paidAmount).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <SearchableSelect
                label="KASA / BANKA HESABI"
                required
                options={accountOptions}
                value={formData.commercialAccountId}
                onChange={(opt) => setFormData(prev => ({ ...prev, commercialAccountId: opt ? String(opt.id) : '' }))}
                placeholder="Kasa/Banka hesabı seçin..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2 sm:col-span-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">TUTAR</label>
                  <PremiumNumberInput 
                    value={formData.amount} 
                    onChange={val => setFormData({...formData, amount: val})}
                    className="h-14"
                  />
                </div>
                <div className="flex flex-col gap-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">DÖVİZ</label>
                  <select 
                    value={formData.currencyId} 
                    onChange={e => setFormData({...formData, currencyId: e.target.value})}
                    className="h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer"
                  >
                    {currencies.map((c: Currency) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">AÇIKLAMA</label>
                <textarea 
                  rows={3} 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="p-5 rounded-3xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors resize-none placeholder:text-slate-350"
                  placeholder="İşlem ile ilgili notlar..."
                />
              </div>

              <div className="flex gap-4 mt-4">
                <button type="submit" className="flex-1 h-14 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-colors shadow-lg shadow-emerald-600/25">
                  İŞLEMİ KAYDET
                </button>
                <button type="button" className="flex-[0.4] h-14 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-colors" onClick={handleCloseModal}>
                  VAZGEÇ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTransferModalOpen && (
        <TransferFundsModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          accounts={accounts}
          currencies={currencies}
          onSubmit={(data) => transferMutation.mutate(data)}
          loading={transferMutation.isPending}
        />
      )}
    </div>
  );
}