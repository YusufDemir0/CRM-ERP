import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partiesAPI, salesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { Party } from '../../types';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { DataTable } from '../../components/common/DataTable';
import { Decimal } from 'decimal.js';
import { useSort } from '../../hooks/useSort';
import { useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSalesWizardStore } from '../../store/useSalesWizardStore';
import { queryKeys } from '../../services/queryKeys';

// Sub-components
import { PartiesHeader } from './Parties/PartiesHeader';
import { getPartiesColumns } from './Parties/PartiesColumns';
import { ViewPartySalesModal } from '../../components/modals/ViewPartySalesModal';
import { ViewSaleModal } from '../../components/modals/ViewSaleModal';

import { useAuth } from '../../hooks/useAuth';

export default function PartiesPage() {
  const { user, hasPermission } = useAuth();
  const canCreate = hasPermission('PARTIES_CREATE');
  const canEditAll = hasPermission('PARTIES_EDIT_ALL');
  const canEditOwn = hasPermission('PARTIES_EDIT_OWN');
  const canDelete = hasPermission('PARTIES_DELETE');

  const canEditParty = useCallback((p: Party) => {
    if (canEditAll) return true;
    if (canEditOwn && String(p.createdBy) === String(user?.id)) return true;
    return false;
  }, [canEditAll, canEditOwn, user]);

  const queryClient = useQueryClient();
  const { openCreate } = useQuickCreateStore();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;
  const searchTerm = searchParams.get('q') || '';
  const filterTab = (searchParams.get('tab') as 'active' | 'passive' | 'all') || 'active';
  const typeTab = (searchParams.get('type') as 'customer' | 'provider' | 'all') || 'all';
  const limit = Number(searchParams.get('limit')) || 20;

  const sort = {
    key: searchParams.get('sortBy') || 'createdAt',
    order: (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC'
  };

  const [filters] = useState<Record<string, unknown>>({});
  const [selectedPartyForSales, setSelectedPartyForSales] = useState<Party | null>(null);
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<any | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const handleOpenSaleDetails = async (saleId: string | number) => {
    setIsFetchingDetails(true);
    const loadingToast = toast.loading("Sipariş detayları yükleniyor...");
    try {
      const res = await salesAPI.getOne(saleId);
      setSelectedSaleForDetails(res.data);
      toast.dismiss(loadingToast);
    } catch (e) {
      toast.error("Satış detayı getirilemedi.");
      toast.dismiss(loadingToast);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const isMovementsMode = window.location.pathname.includes('/movements');

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
  const setFilterTab = (tab: string) => updateParams({ tab, page: 1 });
  const setTypeTab = (type: string) => updateParams({ type, page: 1 });
  const setSearchTerm = (q: string) => updateParams({ q, page: 1 });
  const setSort = (key: string, order: 'ASC' | 'DESC') => updateParams({ sortBy: key, sortOrder: order, page: 1 });

  const { data: movementsData, isLoading: loadingMovements } = useQuery({
    queryKey: ['parties', 'movements', { page, limit, deferredSearch }],
    queryFn: async ({ signal }) => {
      const res = await partiesAPI.getAllMovements({
        page, limit, search: deferredSearch,
      }, { signal });
      return res.data;
    },
    enabled: isMovementsMode,
  });

  const { data: partiesData, isLoading: loadingParties } = useQuery({
    queryKey: queryKeys.parties.all({ page, limit, deferredSearch, filterTab, typeTab, sort, filters, isMovementsMode: false }),
    queryFn: async ({ signal }) => {
      const typeFilter = typeTab === 'all' ? undefined : typeTab;
      const res = await partiesAPI.getAll({
        page, limit, search: deferredSearch,
        state: filterTab === 'all' ? undefined : (filterTab === 'active' ? 1 : 0),
        type: typeFilter,
        sortBy: sort.key, sortOrder: sort.order,
        ...filters
      }, { signal });
      return res.data;
    },
    enabled: !isMovementsMode,
  });

  const parties = partiesData?.data || [];
  const paginationMeta = partiesData?.meta;

  const { sortedData, sortConfigs, toggleSort } = useSort<Party>(
    parties,
    [{ key: sort.key, direction: sort.order.toLowerCase() as 'asc' | 'desc' }],
    (configs) => {
      if (configs.length > 0) {
        setSort(configs[0].key, configs[0].direction.toUpperCase() as 'ASC' | 'DESC');
      }
    }
  );

  const toggleMutation = useMutation({
    mutationFn: ({ id, currentState }: { id: string | number; currentState: number }) =>
      partiesAPI.toggleState(id, currentState),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['parties', 'list'] });
      const previousParties = queryClient.getQueriesData({ queryKey: ['parties', 'list'] });
      queryClient.setQueriesData(
        { queryKey: ['parties', 'list'] },
        (old: { data: Party[] } | undefined) => {
          if (!old?.data || !Array.isArray(old.data)) return old;
          return {
            ...old,
            data: old.data.map((p: Party) =>
              String(p.id) === String(id) ? { ...p, state: p.state === 1 ? 0 : 1 } : p
            )
          };
        }
      );
      return { previousParties };
    },
    onError: (err, variables, context) => {
      if (context?.previousParties) {
        context.previousParties.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
      toast.error("İşlem başarısız");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['parties', 'list'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.parties.lookup });
    },
    onSuccess: () => {
      toast.success("Durum güncellendi");
    },
  });

  const activeData = isMovementsMode ? (movementsData?.data || []) : sortedData;
  const total = isMovementsMode ? (movementsData?.meta?.total || 0) : (paginationMeta?.total || 0);
  const loading = isMovementsMode ? loadingMovements : loadingParties;

  useEffect(() => {
    if (!loading && activeData.length === 0 && page > 1) {
      setPage(Math.max(1, page - 1));
    }
  }, [activeData.length, loading, page]);

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['parties', 'list'] });
    toast.success("Cari kart kaydedildi.");
  };

  const toggleState = async (p: Party) => {
    const currentState = p.state;
    const balance = new Decimal(p.balance || 0);
    if (currentState === 1 && !balance.isZero()) {
      toast.error("Bakiye 0 olmadığı için bu cari pasife alınamaz.");
      return;
    }
    const confirmed = await confirmDialog(
      currentState === 1 ? 'Firmayı/Müşteriyi arşivlemek istiyor musunuz?' : 'Hesap tekrar aktif edilecektir.',
      currentState === 1
    );
    if (confirmed) {
      toggleMutation.mutate({ id: p.id, currentState });
    }
  };

  const handleEdit = (p: Party) => {
    openCreate('party', {
      editingId: p.id,
      initialData: {
        name: p.name || '',
        type: p.type || 'customer',
        taxNumber: p.taxNumber || '',
        phone1: p.phone1 || '',
        phone2: p.phone2 || '',
        email: p.email || '',
        address: p.address || '',
        cityId: p.cityId ? String(p.cityId) : '',
        districtName: p.districtName || '',
        creditLimit: p.creditLimit ? Number(p.creditLimit) : 0,
        currencyId: p.currencyId ? String(p.currencyId) : '',
        notes: p.notes || ''
      },
      onSuccess: handleFormSuccess
    });
  };

  const handleQuickSale = useCallback((partyId: string | number) => {
    const party = parties.find(p => String(p.id) === String(partyId));
    if (party) {
      const salesStore = useSalesWizardStore.getState();
      salesStore.startQuickSale(party);
      navigate('/sales/wizard');
    }
  }, [parties, navigate]);

  const canViewSalesHistory = hasPermission('PARTIES_VIEW_SALES_HISTORY');

  const handleViewSales = useCallback((party: Party) => {
    setSelectedPartyForSales(party);
  }, []);

  const columns = useMemo(() => getPartiesColumns(handleQuickSale, canViewSalesHistory ? handleViewSales : undefined), [handleQuickSale, handleViewSales, canViewSalesHistory]);

  const movementsColumns = useMemo(() => [
    {
      header: 'TARİH',
      accessor: (item: any) => <div className="font-semibold text-slate-700">{item.date ? new Date(item.date).toLocaleDateString('tr-TR') : '—'}</div>,
      sortKey: 'date',
    },
    {
      header: 'MÜŞTERİ / CARİ',
      accessor: (item: any) => (
        <div className="flex flex-col">
          <div className="font-black text-slate-800 text-[14px]">{item.partyName}</div>
          <span className="text-[9px] text-slate-400 font-bold uppercase">
            {item.partyType === 'customer' ? 'MÜŞTERİ' : 'TEDARİKÇİ'}
          </span>
        </div>
      ),
      sortKey: 'partyName',
    },
    {
      header: 'İŞLEM TÜRÜ',
      accessor: (item: any) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          'SALE': { label: 'SATIŞ', color: 'bg-primary/10 text-primary border-primary/20' },
          'CANCEL_SALE': { label: 'SATIŞ İPTAL', color: 'bg-red-100 text-red-700 border-red-200' },
          'DEPOSIT': { label: 'KAPORA', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
          'CANCEL_DEPOSIT': { label: 'KAPORA İPTAL', color: 'bg-amber-100 text-amber-700 border-amber-200' },
          'PAYMENT_IN': { label: 'TAHSİLAT', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
          'PAYMENT_OUT': { label: 'ÖDEME', color: 'bg-rose-100 text-rose-700 border-rose-200' },
          'RECONCILE': { label: 'MUTABAKAT', color: 'bg-slate-100 text-slate-700 border-slate-200' },
        };
        const info = typeMap[item.source] || { label: item.source || 'DİĞER', color: 'bg-slate-100 text-slate-700' };
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black border ${info.color}`}>
            {info.label}
          </span>
        );
      },
      sortKey: 'source',
    },
    {
      header: 'AÇIKLAMA',
      accessor: (item: any) => <div className="text-slate-600 text-xs line-clamp-2 max-w-[300px]">{item.description || '—'}</div>,
    },
    {
      header: 'BORÇ (BORÇLANAN)',
      accessor: (item: any) => (
        <div className="text-right font-black text-rose-600 text-[15px] tabular-nums">
          {item.debit > 0 ? `${item.debit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${item.currency}` : '—'}
        </div>
      ),
      sortKey: 'debit',
      className: 'text-right'
    },
    {
      header: 'ALACAK (ÖDENEN)',
      accessor: (item: any) => (
        <div className="text-right font-black text-emerald-600 text-[15px] tabular-nums">
          {item.credit > 0 ? `${item.credit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${item.currency}` : '—'}
        </div>
      ),
      sortKey: 'credit',
      className: 'text-right'
    }
  ], []);

  const activeColumns = isMovementsMode ? movementsColumns : columns;

  return (
    <div className="animate-in flex flex-col gap-8">
      <PartiesHeader
        filterTab={filterTab} setFilterTab={setFilterTab}
        typeTab={typeTab} setTypeTab={setTypeTab}
        setPage={setPage}
        openCreate={openCreate} handleFormSuccess={handleFormSuccess}
        isMovementsMode={isMovementsMode}
        canCreate={canCreate}
      />

      <div className="flex flex-col gap-4">
        <DataTable<any>
          data={activeData}
          columns={activeColumns}
          isLoading={loading}
          sortConfigs={sortConfigs}
          onSort={toggleSort}
          getRowKey={(p) => p.id}
          hasState={isMovementsMode ? undefined : (p) => p.state === 1}
          onEdit={isMovementsMode ? undefined : (canEditAll || canEditOwn ? handleEdit : undefined)}
          isEditable={isMovementsMode ? undefined : canEditParty}
          onArchive={isMovementsMode ? undefined : (canDelete ? toggleState : undefined)}
          onRestore={isMovementsMode ? undefined : (canDelete ? toggleState : undefined)}
          virtualized={true}

          search={searchTerm}
          onSearchChange={setSearchTerm}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          placeholder={isMovementsMode ? "Açıklama veya cari adı ile ara..." : "Firmayı, yetkiliyi veya vergi numarasını ara..."}
          onRowClick={isMovementsMode ? (item) => item.transactionId && handleOpenSaleDetails(item.transactionId) : undefined}
        />
      </div>

      {selectedPartyForSales && (
        <ViewPartySalesModal
          party={selectedPartyForSales}
          onClose={() => setSelectedPartyForSales(null)}
        />
      )}

      {selectedSaleForDetails && (
        <ViewSaleModal 
          sale={selectedSaleForDetails} 
          onClose={() => setSelectedSaleForDetails(null)} 
        />
      )}
    </div>
  );
}