import React, { useState, useEffect } from 'react';
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
import { PaginationControls } from '../../components/common/PaginationControls';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { useSort } from '../../hooks/useSort';

export function BomsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'passive' | 'all'>('active');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sort, setSort] = useState<{ key: string; order: 'ASC' | 'DESC' }>({ key: 'name', order: 'ASC' });

  const { data: bomsData, isLoading: loading } = useQuery({
    queryKey: ['boms', page, limit, debouncedSearch, filterTab, sort],
    queryFn: async () => {
      const res = await bomsAPI.getAll({
        page,
        limit,
        search: debouncedSearch,
        state: filterTab === 'all' ? undefined : (filterTab === 'active' ? 1 : 0),
        sortBy: sort.key,
        sortOrder: sort.order
      });
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

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const mutation = useMutation({
    mutationFn: ({ id, state }: { id: number; state: number }) => bomsAPI.update(id, { state }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] });
      toast.success("Durum güncellendi");
    },
    onError: () => toast.error("Hata oluştu")
  });

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['boms'] });
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '12px', 
            background: 'var(--primary-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)',
            fontSize: '18px'
          }}>
            <FiLayers />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: '14px' }}>{b.name}</div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>V{b.version}</span>
              {b.isActive && <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--success)', textTransform: 'uppercase' }}>• AKTİF</span>}
            </div>
          </div>
        </div>
      ),
      sortKey: 'name'
    },
    { 
      header: 'HEDEF ÜRÜN', 
      accessor: (b) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiPackage size={14} color="var(--primary)" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--on-surface-variant)' }}>{b.targetItem?.name || '-'}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{b.targetItem?.code}</span>
          </div>
        </div>
      ),
      sortKey: 'targetItemId'
    },
    { 
      header: 'BİLEŞEN SAYISI', 
      accessor: (b) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            padding: '4px 12px', borderRadius: '8px', 
            background: 'var(--surface-container)', color: 'var(--on-surface)',
            fontSize: '13px', fontWeight: 800
          }}>
            {b.items?.length || 0}
          </div>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>KALEM</span>
        </div>
      ),
      sortKey: 'items'
    },
    { 
      header: 'AÇIKLAMA', 
      accessor: (b) => <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{b.description || 'NOT BELİRTİLMEMİŞ'}</span>
    }
  ];

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 🔴 HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '8px', 
            background: 'var(--primary-glow)', color: 'var(--primary)', 
            padding: '6px 14px', borderRadius: '12px', fontSize: '12px', 
            fontWeight: 800, marginBottom: '16px'
          }}>
            <FiTag /> ÜRETİM MİMARİSİ
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--on-surface)' }}>
            Üretim <span style={{ color: 'var(--primary)' }}>Reçeteleri (BOM)</span>
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', background: 'var(--surface-container-low)', padding: '4px', borderRadius: '14px', border: '1px solid var(--border)' }}>
            {[
              { id: 'active', label: 'Aktif', icon: <FiActivity /> },
              { id: 'passive', label: 'Arşiv', icon: <FiArchive /> },
              { id: 'all', label: 'Tümü', icon: <FiFilter /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                style={{
                  height: '36px', padding: '0 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '8px', border: 'none', transition: '0.2s',
                  background: filterTab === tab.id ? 'white' : 'transparent',
                  color: filterTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: filterTab === tab.id ? 'var(--shadow-md)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" style={{ height: '44px', boxShadow: '0 10px 20px var(--primary-glow)' }} onClick={() => {
            openCreate('bom', { onSuccess: handleFormSuccess });
          }}>
            <FiPlus size={18} /> Yeni Reçete
          </button>
        </div>
      </div>

      {/* 🟠 SEARCH & FILTERS */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Reçete adı, hedef ürün veya açıklama ile ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '48px', height: '52px', border: 'none', background: 'var(--surface-container-low)' }}
          />
        </div>
        <button className="btn btn-secondary" style={{ height: '52px', background: 'white' }}>
          <FiFilter /> Gelişmiş Filtrele
        </button>
      </div>

      {/* 🟡 DATA TABLE SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <PaginationControls 
            meta={paginationMeta} 
            onPageChange={setPage} 
            onLimitChange={setLimit} 
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}