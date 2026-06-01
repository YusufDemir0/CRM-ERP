import { useState, useDeferredValue, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsAPI } from '../../services/api';
import { 
  FiArrowUpRight, FiArrowDownLeft, FiRepeat, 
  FiCreditCard
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { formatDisplayDate } from '../../utils/date.helper';
import { queryKeys } from '../../services/queryKeys';
import { Transaction } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Decimal } from 'decimal.js';
import { useSort } from '../../hooks/useSort';

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = Number(searchParams.get('page')) || 1;
  const searchTerm = searchParams.get('q') || '';
  const limit = Number(searchParams.get('limit')) || 20;
  
  const sort = {
    key: searchParams.get('sortBy') || 'date',
    order: (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC'
  };

  const [filters] = useState<Record<string, string | number | undefined>>({});
  const deferredSearch = useDeferredValue(searchTerm);

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
    queryKey: queryKeys.transactions.all({ page, limit, deferredSearch, sort, filters }),
    queryFn: async ({ signal }) => {
      const res = await transactionsAPI.getAll({
        page,
        limit,
        search: deferredSearch,
        sortBy: sort.key,
        sortOrder: sort.order,
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

  const cancelMutation = useMutation({
    mutationFn: (id: string | number) => transactionsAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast.success("İşlem başarıyla iptal edildi.");
    },
    onError: () => toast.error("İşlem iptal edilirken bir hata oluştu.")
  });

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
      </div>

      <div className="flex flex-col gap-4">
        <DataTable<Transaction>
          data={sortedData}
          columns={columns}
          isLoading={loading}
          sortConfigs={sortConfigs}
          onSort={toggleSort}
          getRowKey={(tx) => tx.id}
          onDelete={tx => tx.status !== 'cancelled' ? handleCancelTransaction(tx.id) : undefined}
          
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
    </div>
  );
}