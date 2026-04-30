import { useState, useEffect, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { Item } from '../../types';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { DataTable } from '../../components/common/DataTable';
import { useSort } from '../../hooks/useSort';
import { useDeferredValue } from 'react';
import { queryKeys } from '../../services/queryKeys';
import { useMemo } from 'react';

// Sub-components
import { ItemHeader } from './Items/ItemHeader';
import { getItemColumns } from './Items/ItemColumns';
import { BulkImportModal } from '../../components/modals/BulkImportModal';

export default function ItemsPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = Number(searchParams.get('page')) || 1;
  const searchTerm = searchParams.get('q') || '';
  const filterTab = (searchParams.get('tab') as 'active' | 'passive' | 'all' | 'critical') || 'active';
  const limit = Number(searchParams.get('limit')) || 20;

  const deferredSearch = useDeferredValue(searchTerm);

  const sort = {
    key: searchParams.get('sortBy') || 'name',
    order: (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'ASC'
  };

  const [filters] = useState<Record<string, string | number | (string | number)[]>>({});

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
  
  const { openCreate } = useQuickCreateStore();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { data: itemsData, isLoading: loading } = useQuery({
    queryKey: queryKeys.items.all({ page, limit, deferredSearch, filterTab, sort, filters }),
    queryFn: async ({ signal }) => {
      const res = await itemsAPI.getAll({
        page,
        limit,
        search: deferredSearch,
        state: filterTab === 'all' ? undefined : (filterTab === 'active' || filterTab === 'critical' ? 1 : 0),
        critical: filterTab === 'critical' ? 1 : undefined,
        sortBy: sort.key,
        sortOrder: sort.order,
        ...filters
      }, { signal });
      return res.data;
    }
  });

  const items = itemsData?.data || [];
  const paginationMeta = itemsData?.meta;

  const { sortedData, sortConfigs, toggleSort } = useSort<Item>(
    items, 
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

  // Removed redundant useEffect as searchParams handles initialization


  const toggleMutation = useMutation({
    mutationFn: ({ id, state }: { id: number; state: number }) => itemsAPI.toggleState(id, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', 'list'] });
      toast.success("Durum güncellendi");
    },
    onError: () => toast.error("Hata oluştu")
  });

  const handleFormSuccess = (data?: unknown) => {
    // 🔥 Hem manuel cache güncellemesi yap hem de tüm listeyi geçersiz kıl
    const itemData = data as Item | undefined;
    if (itemData && itemData.id) {
      queryClient.setQueriesData({ queryKey: ['items', 'list'] }, (old: { data: Item[] } | undefined) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((item: Item) => (itemData && itemData.id === item.id) ? { ...item, ...itemData } : item)
        };
      });
    }
    queryClient.invalidateQueries({ queryKey: ['items', 'list'] });
    toast.success("İşlem başarıyla tamamlandı.");
  };

  const handleEdit = (item: Item) => {
    openCreate('item', {
      editingId: item.id,
      initialData: item as unknown as Record<string, unknown>,
      onSuccess: handleFormSuccess
    });
  };

  const toggleState = async (id: number, currentState: number) => {
    const confirmed = await confirmDialog(
      currentState === 1 ? 'Ürünü pasife alıp arşivlemek istiyor musunuz?' : 'Ürünü yeniden aktif ediyorsunuz. Emin misiniz?', 
      currentState === 1
    );
    if (confirmed) {
      toggleMutation.mutate({ id, state: currentState });
    }
  };

  const columns = useMemo(() => getItemColumns(() => ({ isOver: false, totalAvailable: 0 })), []);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      const existingItem = items.find(i => i.id === Number(id));
      if (existingItem) {
        handleEdit(existingItem);
        updateParams({ id: undefined });
      } else {
        // Fetch from API if not in current page
        itemsAPI.getOne(Number(id)).then(res => {
          if (res.data) {
            handleEdit(res.data);
            updateParams({ id: undefined });
          }
        }).catch(() => {
          toast.error("Ürün bulunamadı");
          updateParams({ id: undefined });
        });
      }
    }
  }, [searchParams, items]);

  return (
    <div className="animate-in flex flex-col gap-8">
      <ItemHeader 
        filterTab={filterTab} 
        setFilterTab={setFilterTab} 
        setPage={setPage} 
        openCreate={openCreate} 
        handleFormSuccess={handleFormSuccess} 
        onImport={() => setIsImportModalOpen(true)}
      />

      {isImportModalOpen && (
        <BulkImportModal 
          onClose={() => setIsImportModalOpen(false)} 
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['items', 'list'] });
          }} 
        />
      )}

      <div className="flex flex-col gap-4">
        <DataTable<Item>
          data={sortedData}
          columns={columns}
          isLoading={loading}
          sortConfigs={sortConfigs}
          onSort={toggleSort}
          getRowKey={(item) => item.id}
          hasState={(item) => item.state === 1}
          onEdit={handleEdit}
          onArchive={(item) => toggleState(item.id, 1)}
          onRestore={(item) => toggleState(item.id, 0)}
          
          // Integrated Search & Pagination
          search={searchTerm}
          onSearchChange={(val) => { setSearchTerm(val); setPage(1); }}
          total={paginationMeta?.total || 0}
          page={page}
          limit={limit}
          onPageChange={setPage}
          placeholder="Ürün adı, stok kodu veya barkod ile ara..."
        />
      </div>
    </div>
  );
}