import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bomsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { 
  FiEdit2, FiArchive, FiRefreshCw, FiCopy, FiSearch, FiPlus, 
  FiFilter, FiLayers, FiPackage, FiActivity, FiTag
} from 'react-icons/fi';
import { Bom, BomItem } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { useSort } from '../../hooks/useSort';
import { useDebounce } from '../../hooks/useDebounce';
import { queryKeys } from '../../services/queryKeys';

export function BomsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [filterTab, setFilterTab] = useState<'active' | 'passive' | 'all'>('active');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sort, setSort] = useState<{ key: string; order: 'ASC' | 'DESC' }>({ key: 'name', order: 'ASC' });

  const { data: bomsData, isLoading: loading } = useQuery({
    queryKey: queryKeys.boms.all({ page, limit, search: debouncedSearch, filterTab, sort }),
    queryFn: async ({ signal }) => {
      const res = await bomsAPI.getAll({
        page, limit, search: debouncedSearch,
        state: filterTab === 'all' ? undefined : (filterTab === 'active' ? 1 : 0),
        sortBy: sort.key, sortOrder: sort.order
      }, { signal });
      return res.data;
    }
  });

  const boms = bomsData?.data || [];
  const paginationMeta = bomsData?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 };

  const { sortedData, sortConfigs, toggleSort } = useSort<Bom>(
    boms, 
    [{ key: sort.key, direction: sort.order.toLowerCase() as 'asc' | 'desc' }],
    (configs) => {
      if (configs.length > 0) {
        setSort({ 
          key: configs[0].key, 
          order: configs[0].direction.toUpperCase() as 'ASC' | 'DESC' 
        });
        setPage(1); // FE-01: Reset page on sort change
      }
    }
  );
  const { openCreate } = useQuickCreateStore();


  const mutation = useMutation({
    mutationFn: ({ id, state }: { id: number; state: number }) => bomsAPI.update(id, { state }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boms.all({}) });
      toast.success("Durum güncellendi");
    },
    onError: () => toast.error("Hata oluştu")
  });

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.boms.all({}) });
    toast.success("Reçete başarıyla kaydedildi.");
  };

  const handleEdit = (b: Bom) => {
    openCreate('bom', {
      editingId: b.id,
      initialData: {
        name: b.name || '', 
        targetItemId: String(b.targetItemId || ''),
        description: b.description || '',
        items: b.items?.map((bi: BomItem) => ({ itemId: bi.itemId, quantity: Number(bi.quantity), description: bi.description || '' })) || []
      },
      onSuccess: handleFormSuccess
    });
  };

  const handleClone = (b: Bom) => {
    openCreate('bom', {
      initialData: {
        name: `${b.name} (KOPYA)`, 
        targetItemId: String(b.targetItemId || ''),
        description: b.description || '',
        items: b.items?.map((bi: BomItem) => ({ itemId: bi.itemId, quantity: Number(bi.quantity), description: bi.description || '' })) || []
      },
      onSuccess: handleFormSuccess
    });
    toast("Reçete kopyalandı. Değişiklik yapıp yeni olarak kaydedebilirsiniz.", { icon: 'ℹ️' });
  };

  const toggleState = async (id: number, currentState: number) => {
    const confirmed = await confirmDialog(currentState === 1 ? 'Reçeteyi pasife alıp arşivlemek istiyor musunuz?' : 'Reçeteyi yeniden aktif ediyorsunuz. Emin misiniz?', currentState === 1);
    if (confirmed) {
      mutation.mutate({ id, state: currentState === 1 ? 0 : 1 });
    }
  };

  const columns: Column<Bom>[] = [
    { 
      header: 'REÇETE KİMLİĞİ', 
      accessor: (b) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg">
            <FiLayers />
          </div>
          <div>
            <div className="font-black text-on-surface text-sm uppercase tracking-tighter">{b.name}</div>
          </div>
        </div>
      ),
      sortKey: 'name'
    },
    { 
      header: 'HEDEF ÜRÜN', 
      accessor: (b) => (
        <div className="flex items-center gap-2">
          <FiPackage className="text-primary text-sm" />
          <div className="flex flex-col">
            <span className="font-bold text-xs sm:text-sm text-on-surface-variant uppercase tracking-tighter">{b.targetItem?.name || '-'}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{b.targetItem?.code}</span>
          </div>
        </div>
      ),
      sortKey: 'targetItemId'
    },
    { 
      header: 'BİLEŞEN SAYISI', 
      accessor: (b) => (
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-lg bg-surface-container text-on-surface text-xs font-black">
            {b.items?.length || 0}
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KALEM</span>
        </div>
      ),
      sortKey: 'items'
    },
    { 
      header: 'AÇIKLAMA', 
      accessor: (b) => <span className="text-xs text-slate-400 font-medium italic">{b.description || 'NOT BELİRTİLMEMİŞ'}</span>
    }
  ];

  return (
    <div className="animate-in flex flex-col gap-8">
      
      {/* 🔴 HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <FiTag /> ÜRETİM MİMARİSİ
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-on-surface">
            Üretim <span className="text-primary">Reçeteleri (BOM)</span>
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex bg-surface-container-low p-1 rounded-2xl border border-surface-container">
            {[
              { id: 'active', label: 'Aktif', icon: <FiActivity /> },
              { id: 'passive', label: 'Arşiv', icon: <FiArchive /> },
              { id: 'all', label: 'Tümü', icon: <FiFilter /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as 'active' | 'passive' | 'all')}
                className={`h-9 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition-colors ${
                  filterTab === tab.id ? 'bg-white text-primary shadow-premium' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <button className="h-12 px-6 bg-primary text-white rounded-2xl font-black text-sm shadow-premium flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-colors" onClick={() => {
            openCreate('bom', { onSuccess: handleFormSuccess });
          }}>
            <FiPlus size={20} /> Yeni Reçete
          </button>
        </div>
      </div>

      {/* 🟠 DATA TABLE */}
      <DataTable<Bom>
        data={sortedData}
        columns={columns}
        isLoading={loading}
        sortConfigs={sortConfigs}
        onSort={toggleSort}
        getRowKey={(b) => b.id}
        hasState={(b) => b.state === 1}
        onEdit={handleEdit}
        onClone={handleClone}
        onArchive={(b) => toggleState(b.id, 1)}
        onRestore={(b) => toggleState(b.id, 0)}
        getRowOpacity={(b) => b.state === 0 ? 0.5 : 1}
        
        // Integrated Search & Pagination
        search={searchTerm}
        onSearchChange={(val) => { setSearchTerm(val); setPage(1); }}
        total={paginationMeta.total}
        page={page}
        limit={limit}
        onPageChange={setPage}
      />
    </div>
  );
}