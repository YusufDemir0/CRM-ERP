import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsAPI } from '../../services/api';
import { 
  FiEdit2, FiArchive, FiRefreshCw, FiSearch, FiCreditCard, 
  FiPlus, FiFilter, FiActivity, FiBriefcase, FiHash
} from 'react-icons/fi';
import { confirmDialog } from '../../utils/confirmDialog';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import toast from 'react-hot-toast';
import { Account } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { useSort } from '../../hooks/useSort';
import { Decimal } from 'decimal.js';
import { useDeferredValue } from 'react';
import { queryKeys } from '../../services/queryKeys';

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = Number(searchParams.get('page')) || 1;
  const searchTerm = searchParams.get('q') || '';
  const filterTab = (searchParams.get('tab') as 'active' | 'passive' | 'all') || 'active';
  const limit = Number(searchParams.get('limit')) || 20;

  const deferredSearch = useDeferredValue(searchTerm);
  const { openCreate } = useQuickCreateStore();

  const sort = {
    key: searchParams.get('sortBy') || 'name',
    order: (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'ASC'
  };

  const [filters] = useState<Record<string, unknown>>({});

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
  const setFilterTab = (tab: string) => updateParams({ tab, page: 1 });
  const setSearchTerm = (q: string) => updateParams({ q, page: 1 });
  const setSort = (key: string, order: 'ASC' | 'DESC') => updateParams({ sortBy: key, sortOrder: order, page: 1 });

  const { data: accountsData, isLoading: loading } = useQuery({
    queryKey: queryKeys.accounts.all({ page, limit, deferredSearch, filterTab, sort, filters }),
    queryFn: async ({ signal }) => {
      const res = await accountsAPI.getAll({
        search: deferredSearch, page, limit,
        state: filterTab === 'all' ? undefined : (filterTab === 'active' ? 1 : 0),
        sortBy: sort.key, sortOrder: sort.order, ...filters
      }, { signal });
      return res.data;
    }
  });

  const accounts = accountsData?.data || [];
  const paginationMeta = accountsData?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 };

  const { sortedData, sortConfigs, toggleSort } = useSort<Account>(
    accounts, 
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

  const toggleMutation = useMutation({
    mutationFn: ({ id, state }: { id: string | number; state: number }) => accountsAPI.toggleState(id, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success("Durum güncellendi");
    },
    onError: () => toast.error("İşlem başarısız oldu.")
  });

  const handleFormSubmit = () => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    toast.success("Hesap bilgileri kaydedildi.");
  };

  const handleEdit = (acc: Account) => {
    openCreate('account', {
      editingId: acc.id,
      initialData: {
        name: acc.name || '',
        bankName: acc.bankName || '',
        iban: acc.iban || '',
        ibanName: acc.ibanName || '',
        currencyId: acc.currencyId ? String(acc.currencyId) : '',
        criticalLimit: Number(acc.criticalLimit) || 0,
        description: acc.description || ''
      },
      onSuccess: handleFormSubmit
    });
  };

  const toggleState = async (id: string | number, currentState: number) => {
    const confirmed = await confirmDialog(currentState === 1 ? 'Hesap pasife alınacak (arşivlenecek). Emin misiniz?' : 'Hesap tekrar aktifleştirilecek. Emin misiniz?', currentState === 1);
    if (confirmed) {
      toggleMutation.mutate({ id, state: currentState });
    }
  };

  const columns: Column<Account>[] = [
    { 
      header: 'HESAP BİLGİSİ', 
      accessor: (acc) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg">
            <FiCreditCard />
          </div>
          <div>
            <div className="font-black text-on-surface text-sm">{acc.name}</div>
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">{acc.bankName || 'NAKİT KASA'}</div>
          </div>
        </div>
      ),
      sortKey: 'name'
    },
    { 
      header: 'BANKA / ŞUBE', 
      accessor: (acc) => <span className="font-bold text-xs text-secondary bg-surface-container px-3 py-1 rounded-lg uppercase tracking-widest">{acc.bankName || 'NAKİT KASA'}</span>,
      sortKey: 'bankName'
    },
    { 
      header: 'IBAN DETAYI', 
      accessor: (acc) => (
        <div className="flex items-center gap-2">
          <FiHash size={12} className="text-slate-400" />
          <span className="tabular-nums text-xs font-bold text-on-surface-variant tracking-tighter">{acc.iban || 'BELİRTİLMEMİŞ'}</span>
        </div>
      ),
      sortKey: 'iban'
    },
    { 
      header: 'KRİTİK LİMİT', 
      accessor: (acc) => {
        const limit = new Decimal(acc.criticalLimit || 0);
        return (
          <div className="text-right flex flex-col items-end">
            <span className={`tabular-nums font-black text-base tracking-tighter ${limit.lt(0) ? 'text-danger' : 'text-on-surface'}`}>
              {limit.toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {acc.currency?.symbol || '₺'}
            </span>
          </div>
        );
      },
      sortKey: 'criticalLimit',
      className: 'text-right'
    },
    {
      header: 'DURUM',
      accessor: (acc) => (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          acc.state === 1 
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
            : 'bg-red-50 text-red-600 border border-red-100'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${acc.state === 1 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          {acc.state === 1 ? 'AKTİF' : 'ARŞİV'}
        </div>
      ),
      sortKey: 'state'
    }
  ];

  return (
    <div className="animate-in flex flex-col gap-8">
      
      {/* 🔴 HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <FiBriefcase /> FİNANSAL VARLIK YÖNETİMİ
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-on-surface">
            Kasa & <span className="text-primary">Banka Hesapları</span>
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex bg-surface-container-low p-1 rounded-2xl border border-surface-container shadow-sm">
            {[
              { id: 'active', label: 'Aktif', icon: <FiActivity /> },
              { id: 'passive', label: 'Arşiv', icon: <FiArchive /> },
              { id: 'all', label: 'Tümü', icon: <FiFilter /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`h-9 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                  filterTab === tab.id 
                    ? 'bg-white text-primary shadow-premium ring-1 ring-black/5' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
                }`}
              >
                {tab.icon} {tab.label.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="h-12 px-6 bg-primary text-white rounded-2xl font-black text-sm shadow-premium flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-colors" onClick={() => {
            openCreate('account', { onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all({}) }) });
          }}>
            <FiPlus size={20} /> Yeni Hesap
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <DataTable<Account>
          data={sortedData}
          columns={columns}
          isLoading={loading}
          sortConfigs={sortConfigs}
          onSort={toggleSort}
          getRowKey={(acc) => acc.id}
          hasState={(acc) => acc.state === 1}
          onEdit={handleEdit}
          onArchive={(acc) => toggleState(acc.id, 1)}
          onRestore={(acc) => toggleState(acc.id, 0)}
          getRowOpacity={(acc) => acc.state === 0 ? 0.5 : 1}
          
          // Integrated Search & Pagination
          search={searchTerm}
          onSearchChange={setSearchTerm}
          total={paginationMeta.total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          placeholder="Hesap adı, banka veya IBAN ile ara..."
        />
      </div>
    </div>
  );
}