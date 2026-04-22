import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partiesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { Party } from '../../types';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { DataTable } from '../../components/common/DataTable';
import { Decimal } from 'decimal.js';
import { useSort } from '../../hooks/useSort';
import { useDeferredValue } from 'react';
import { queryKeys } from '../../services/queryKeys';

// Sub-components
import { PartiesHeader } from './Parties/PartiesHeader';
import { getPartiesColumns } from './Parties/PartiesColumns';

export default function PartiesPage() {
  const queryClient = useQueryClient();
  const { openCreate } = useQuickCreateStore();

  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = Number(searchParams.get('page')) || 1;
  const searchTerm = searchParams.get('q') || '';
  const filterTab = (searchParams.get('tab') as 'active' | 'passive' | 'all') || 'active';
  const limit = Number(searchParams.get('limit')) || 20;

  const sort = {
    key: searchParams.get('sortBy') || 'name',
    order: (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'ASC'
  };

  const [filters] = useState<Record<string, unknown>>({});

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
  const setSearchTerm = (q: string) => updateParams({ q, page: 1 });
  const setSort = (key: string, order: 'ASC' | 'DESC') => updateParams({ sortBy: key, sortOrder: order, page: 1 });

  const { data: partiesData, isLoading: loading } = useQuery({
    queryKey: queryKeys.parties.all({ page, limit, deferredSearch, filterTab, sort, filters }),
    queryFn: async ({ signal }) => {
      const res = await partiesAPI.getAll({
        page, limit, search: deferredSearch,
        state: filterTab === 'all' ? undefined : (filterTab === 'active' ? 1 : 0),
        sortBy: sort.key, sortOrder: sort.order, ...filters
      }, { signal });
      return res.data;
    },
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
    mutationFn: ({ id, currentState }: { id: number; currentState: number }) => 
      partiesAPI.toggleState(id, currentState),
    onMutate: async ({ id }) => {
      // FE-18: Optimistic Update Implementation
      await queryClient.cancelQueries({ queryKey: queryKeys.parties.all({}) });

      const previousParties = queryClient.getQueriesData({ queryKey: queryKeys.parties.all({}) });

      queryClient.setQueriesData(
        { queryKey: queryKeys.parties.all({}) },
        (old: { data: Party[] } | undefined) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((p: Party) => 
              p.id === id ? { ...p, state: p.state === 1 ? 0 : 1 } : p
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
      queryClient.invalidateQueries({ queryKey: queryKeys.parties.all({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.parties.lookup });
    },
    onSuccess: () => {
      toast.success("Durum güncellendi");
    },
  });

  useEffect(() => {
    if (!loading && parties.length === 0 && paginationMeta && paginationMeta.total > 0 && page > 1) {
      setPage(Math.max(1, page - 1));
    }
  }, [parties.length, loading, page, paginationMeta]);

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.parties.all({}) });
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
        phone: p.phone1 || '',
        email: p.email || '',
        address: p.address || ''
      },
      onSuccess: handleFormSuccess
    });
  };

  const columns = useMemo(() => getPartiesColumns(), []);

  return (
    <div className="animate-in flex flex-col gap-8">
      <PartiesHeader 
        filterTab={filterTab} setFilterTab={setFilterTab} setPage={setPage} 
        openCreate={openCreate} handleFormSuccess={handleFormSuccess} 
      />

      <div className="flex flex-col gap-4">
        <DataTable<Party>
          data={sortedData} 
          columns={columns} 
          isLoading={loading} 
          sortConfigs={sortConfigs} 
          onSort={toggleSort}
          getRowKey={(p) => p.id} 
          hasState={(p) => p.state === 1} 
          onEdit={handleEdit}
          onArchive={toggleState} 
          onRestore={toggleState}
          
          // Integrated Search & Pagination
          search={searchTerm}
          onSearchChange={(val) => { setSearchTerm(val); setPage(1); }}
          total={paginationMeta?.total || 0}
          page={page}
          limit={limit}
          onPageChange={setPage}
          placeholder="Firmayı, yetkiliyi veya vergi numarasını ara..."
        />
      </div>
    </div>
  );
}