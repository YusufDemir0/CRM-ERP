import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { Item } from '../../types';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { DataTable } from '../../components/common/DataTable';
import { PaginationControls } from '../../components/common/PaginationControls';
import { useSort } from '../../hooks/useSort';

// Sub-components
import { ItemHeader } from './Items/ItemHeader';
import { ItemFilters } from './Items/ItemFilters';
import { getItemColumns } from './Items/ItemColumns';

export default function ItemsPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialFilter = (queryParams.get('filter') as 'active' | 'passive' | 'all' | 'critical') || 'active';

  const [filterTab, setFilterTab] = useState<'active' | 'passive' | 'all' | 'critical'>(initialFilter);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sort, setSort] = useState<{ key: string; order: 'ASC' | 'DESC' }>({ key: 'name', order: 'ASC' });
  const [filters] = useState<Record<string, string | number | (string | number)[]>>({});
  
  const { openCreate } = useQuickCreateStore();

  const { data: itemsData, isLoading: loading } = useQuery({
    queryKey: ['items', page, limit, debouncedSearch, filterTab, sort, filters],
    queryFn: async () => {
      const res = await itemsAPI.getAll({
        page,
        limit,
        search: debouncedSearch,
        state: filterTab === 'all' ? undefined : (filterTab === 'active' || filterTab === 'critical' ? 1 : 0),
        critical: filterTab === 'critical' ? 1 : undefined,
        sortBy: sort.key,
        sortOrder: sort.order,
        ...filters
      });
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
        setSort({ 
          key: configs[0].key, 
          order: configs[0].direction.toUpperCase() as 'ASC' | 'DESC' 
        });
        setPage(1);
      }
    }
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const f = params.get('filter');
    if (f && ['active', 'passive', 'all', 'critical'].includes(f)) {
      setFilterTab(f as any);
      setPage(1);
    }
  }, [location.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); 
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const toggleMutation = useMutation({
    mutationFn: ({ id, state }: { id: number; state: number }) => itemsAPI.toggleState(id, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success("Durum güncellendi");
    },
    onError: () => toast.error("Hata oluştu")
  });

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['items'] });
    toast.success("İşlem başarıyla tamamlandı.");
  };

  const handleEdit = (item: Item) => {
    openCreate('item', {
      editingId: item.id,
      initialData: item,
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

  const columns = getItemColumns(() => ({ isOver: false, totalAvailable: 0 })); // Note: Logic simplified for brevity or can be passed if context exists

  return (
    <div className="animate-in flex flex-col gap-8">
      <ItemHeader 
        filterTab={filterTab} 
        setFilterTab={setFilterTab} 
        setPage={setPage} 
        openCreate={openCreate} 
        handleFormSuccess={handleFormSuccess} 
      />

      <ItemFilters 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
      />

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
        />

        <div className="flex justify-end">
          <PaginationControls 
            meta={paginationMeta || { total: 0, page: 1, limit: 20, totalPages: 0 }} 
            onPageChange={setPage} 
            onLimitChange={setLimit} 
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}