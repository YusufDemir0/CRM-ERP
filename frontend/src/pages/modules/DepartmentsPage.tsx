import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsAPI } from '../../services/api';
import { 
  FiEdit2, FiArchive, FiRefreshCw, FiSearch, FiPlus, 
  FiFilter, FiBriefcase, FiActivity, FiUsers, FiGlobe
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { useSort } from '../../hooks/useSort';
import { DataTable, Column } from '../../components/common/DataTable';
import { PaginationControls } from '../../components/common/PaginationControls';

import { Department } from '../../types';

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'passive' | 'all'>('active');
  const { openCreate } = useQuickCreateStore();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sort, setSort] = useState<{ key: string; order: 'ASC' | 'DESC' }>({ key: 'name', order: 'ASC' });

  const { data: departmentsData, isLoading: loading } = useQuery({
    queryKey: ['departments', page, limit, debouncedSearch, filterTab, sort],
    queryFn: async () => {
      const res = await departmentsAPI.getAll({ 
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

  const departments: Department[] = departmentsData?.data || [];

  const { sortedData, sortConfigs, toggleSort } = useSort<Department>(
    departments, 
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

  // Search Debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const paginationMeta = departmentsData?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 };

  const mutation = useMutation({
    mutationFn: ({ id, state }: { id: number; state: number }) => departmentsAPI.toggleState(id, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success("Durum güncellendi.");
    },
    onError: () => toast.error("Hata oluştu.")
  });

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['departments'] });
    toast.success("Departman bilgileri kaydedildi.");
  };

  const handleEdit = (dept: Department) => {
    openCreate('department', {
      editingId: dept.id,
      initialData: {
        name: dept.name || '',
        description: dept.description || '',
        abbreviation: dept.abbreviation || '',
        departmentTypeId: dept.departmentTypeId || '',
        commercialAccountId: dept.commercialAccountId || ''
      },
      onSuccess: handleFormSuccess
    });
  };

  const toggleState = async (id: number, currentState: number) => {
    const confirmed = await confirmDialog(currentState === 1 ? 'Departmanı arşivlemek istediğinize emin misiniz?' : 'Departman tekrar aktif edilecektir. Onaylıyor musunuz?', currentState === 1);
    if (confirmed) {
      mutation.mutate({ id, state: currentState });
    }
  };

  const columns: Column<Department>[] = [
    { 
      header: 'BİRİM ADI', 
      accessor: (d) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '12px', 
            background: 'var(--primary-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)',
            fontSize: '18px'
          }}>
            <FiBriefcase />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: '14px' }}>{d.name}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', gap: '6px' }}>
              {d.abbreviation ? `#${d.abbreviation}` : 'BİRİM KODU YOK'}
              {d.state === 0 && <span style={{ color: 'var(--error)', fontWeight: 900 }}>• PASİF</span>}
            </div>
          </div>
        </div>
      ),
      sortKey: 'name'
    },
    { 
      header: 'TÜR / KATEGORİ', 
      accessor: (d) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            padding: '4px 12px', borderRadius: '8px', 
            background: 'var(--surface-container)', color: 'var(--secondary)',
            fontSize: '11px', fontWeight: 800, textTransform: 'uppercase'
          }}>
            {d.departmentType?.name || 'GENEL'}
          </div>
        </div>
      ),
      sortKey: 'departmentType.name'
    },
    { 
      header: 'FİNANSAL BAĞLANTI', 
      accessor: (d) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiGlobe size={13} color="var(--primary)" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--on-surface-variant)' }}>
            {d.commercialAccount?.name || 'NAKİT / MERKEZ'}
          </span>
        </div>
      ),
      sortKey: 'commercialAccount.name'
    },
    { 
      header: 'AÇIKLAMA', 
      accessor: (d) => <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{d.description || 'NOT BELİRTİLMEMİŞ'}</span>
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
            <FiUsers /> ORGANİZASYON ŞEMASI
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--on-surface)' }}>
            Şirket <span style={{ color: 'var(--primary)' }}>Departmanları</span>
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
                onClick={() => { setFilterTab(tab.id as any); setPage(1); }}
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
            openCreate('department', { onSuccess: handleFormSuccess });
          }}>
            <FiPlus size={18} /> Yeni Departman
          </button>
        </div>
      </div>

      {/* 🟠 SEARCH & FILTERS */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Departman adı, kod veya açıklama ile ara..." 
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
        <DataTable<Department>
          data={sortedData}
          columns={columns}
          isLoading={loading}
          sortConfigs={sortConfigs}
          onSort={toggleSort}
          getRowKey={(d) => d.id}
          hasState={(d) => d.state === 1}
          onEdit={handleEdit}
          onArchive={(d) => toggleState(d.id, 1)}
          onRestore={(d) => toggleState(d.id, 0)}
          getRowOpacity={(d) => d.state === 0 ? 0.5 : 1}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
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