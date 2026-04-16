import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partiesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { Party } from '../../types';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { DataTable } from '../../components/common/DataTable';
import { PaginationControls } from '../../components/common/PaginationControls';
import { Decimal } from 'decimal.js';
import { useSort } from '../../hooks/useSort';

// Sub-components
import { PartiesHeader } from './Parties/PartiesHeader';
import { PartiesFilters } from './Parties/PartiesFilters';
import { getPartiesColumns } from './Parties/PartiesColumns';

export default function PartiesPage() {
  const queryClient = useQueryClient();
  const { openCreate } = useQuickCreateStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'passive' | 'all'>('active');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sort, setSort] = useState<{ key: string; order: 'ASC' | 'DESC' }>({ key: 'name', order: 'ASC' });
  const [filters] = useState<Record<string, any>>({});

  const { data: partiesData, isLoading: loading } = useQuery({
    queryKey: ['parties', page, limit, searchTerm, filterTab, sort, filters],
    queryFn: async () => {
      const res = await partiesAPI.getAll({
        page, limit, search: searchTerm,
        state: filterTab === 'all' ? undefined : (filterTab === 'active' ? 1 : 0),
        sortBy: sort.key, sortOrder: sort.order, ...filters
      });
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
        setSort({ key: configs[0].key, order: configs[0].direction.toUpperCase() as 'ASC' | 'DESC' });
        setPage(1);
      }
    }
  );

  const toggleMutation = useMutation({
    mutationFn: ({ id, currentState }: { id: number; currentState: number }) => 
      partiesAPI.toggleState(id, currentState),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast.success("Durum güncellendi");
    },
    onError: () => toast.error("İşlem başarısız")
  });

  React.useEffect(() => {
    if (!loading && parties.length === 0 && paginationMeta && paginationMeta.total > 0 && page > 1) {
      setPage(prev => Math.max(1, prev - 1));
    }
  }, [parties.length, loading, page, paginationMeta]);

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['parties'] });
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

  const columns = getPartiesColumns();

  return (
    <div className="animate-in flex flex-col gap-8">
      <PartiesHeader 
        filterTab={filterTab} setFilterTab={setFilterTab} setPage={setPage} 
        openCreate={openCreate} handleFormSuccess={handleFormSuccess} 
      />

      <PartiesFilters 
        searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
      />

      <div className="flex flex-col gap-4">
        <DataTable<Party>
          data={sortedData} columns={columns} isLoading={loading} sortConfigs={sortConfigs} onSort={toggleSort}
          getRowKey={(p) => p.id} hasState={(p) => p.state === 1} onEdit={handleEdit}
          onArchive={toggleState} onRestore={toggleState}
        />

        <div className="flex justify-end">
          <PaginationControls 
            meta={paginationMeta || { total: 0, page: 1, limit: 20, totalPages: 0 }} 
            onPageChange={setPage} onLimitChange={setLimit} loading={loading}
          />
        </div>
      </div>
    </div>
  );
}