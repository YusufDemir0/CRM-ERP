import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsAPI } from '../../services/api';
import { 
  FiEdit2, FiArchive, FiRefreshCw, FiSearch, FiPlus, 
  FiFilter, FiBriefcase, FiActivity, FiUsers, FiGlobe, FiEye, FiArrowLeft
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { DataTable, Column } from '../../components/common/DataTable';
import { useSort } from '../../hooks/useSort';
import { useDeferredValue } from 'react';
import { queryKeys } from '../../services/queryKeys';

import { Department } from '../../types';
import { StaffList } from '../../components/departments/StaffList';
import { DepartmentPartiesList } from '../../components/departments/DepartmentPartiesList';

export default function DepartmentsPage() {
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

  const [viewingDepartment, setViewingDepartment] = useState<Department | null>(null);
  const [detailsTab, setDetailsTab] = useState<'staff' | 'parties'>('staff');

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

  const { data: departmentsData, isLoading: loading } = useQuery({
    queryKey: queryKeys.departments.all({ page, limit, deferredSearch, filterTab, sort }),
    queryFn: async ({ signal }) => {
      const res = await departmentsAPI.getAll({ 
        page, limit, search: deferredSearch,
        state: filterTab === 'all' ? undefined : (filterTab === 'active' ? 1 : 0),
        sortBy: sort.key, sortOrder: sort.order
      }, { signal });
      return res.data;
    }
  });

  const departments: Department[] = departmentsData?.data || [];
  const paginationMeta = departmentsData?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 };

  const { sortedData, sortConfigs, toggleSort } = useSort<Department>(
    departments, 
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

  const mutation = useMutation({
    mutationFn: ({ id, state }: { id: number; state: number }) => departmentsAPI.toggleState(id, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all({}) });
      toast.success("Durum güncellendi.");
    },
    onError: () => toast.error("Hata oluştu.")
  });

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.departments.all({}) });
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg font-black uppercase">
            <FiBriefcase />
          </div>
          <div>
            <div className="font-black text-on-surface text-sm tracking-tighter uppercase">{d.name}</div>
            <div className="text-[10px] text-slate-400 font-bold tracking-widest flex items-center gap-2">
              {d.abbreviation ? `#${d.abbreviation}` : 'KODSUZ'}
              {d.state === 0 && <span className="text-danger font-black uppercase tracking-widest text-[8px] bg-danger/5 px-1.5 py-0.5 rounded-md">• PASİF İŞLEM</span>}
            </div>
          </div>
        </div>
      ),
      sortKey: 'name'
    },
    { 
      header: 'TÜR / KATEGORİ', 
      accessor: (d) => (
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-lg bg-surface-container text-secondary text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-sm">
            {d.departmentType?.name || 'GENEL'}
          </div>
        </div>
      ),
      sortKey: 'departmentType.name'
    },
    { 
      header: 'FİNANSAL BAĞLANTI', 
      accessor: (d) => (
        <div className="flex items-center gap-2">
          <FiGlobe className="text-primary text-sm opacity-50" />
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">
            {d.commercialAccount?.name || 'NAKİT / MERKEZ'}
          </span>
        </div>
      ),
      sortKey: 'commercialAccount.name'
    },
    { 
      header: 'AÇIKLAMA', 
      accessor: (d) => <span className="text-xs text-slate-400 font-medium italic tabular-nums line-clamp-1">{d.description || 'NOT BELİRTİLMEMİŞ'}</span>,
      sortKey: 'description'
    }
  ];

  if (viewingDepartment) {
    return (
      <div className="animate-in flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setViewingDepartment(null)}
            className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <FiArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-on-surface uppercase">
              {viewingDepartment.name}
            </h1>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">DEPARTMAN DETAYI VE PERSONEL YÖNETİMİ</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-premium">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">DEPARTMAN BİLGİLERİ</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KOD / KISALTMA</div>
                  <div className="font-bold text-slate-800">{viewingDepartment.abbreviation || 'BELİRTİLMEMİŞ'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KATEGORİ</div>
                  <div className="font-bold text-slate-800">{viewingDepartment.departmentType?.name || 'GENEL'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FİNANSAL BAĞLANTI</div>
                  <div className="font-bold text-slate-800">{viewingDepartment.commercialAccount?.name || 'NAKİT / MERKEZ'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AÇIKLAMA</div>
                  <div className="text-sm text-slate-500 italic">{viewingDepartment.description || 'NOT BELİRTİLMEMİŞ'}</div>
                </div>
              </div>

              <button 
                onClick={() => handleEdit(viewingDepartment)}
                className="w-full h-12 mt-8 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center gap-2"
              >
                <FiEdit2 /> BİLGİLERİ DÜZENLE
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-4 border-b border-slate-100 px-2">
              <button 
                className={`px-4 py-3 font-black text-xs uppercase tracking-widest border-b-2 transition-all ${detailsTab === 'staff' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                onClick={() => setDetailsTab('staff')}
              >
                PERSONELLER
              </button>
              <button 
                className={`px-4 py-3 font-black text-xs uppercase tracking-widest border-b-2 transition-all ${detailsTab === 'parties' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                onClick={() => setDetailsTab('parties')}
              >
                İLGİLİ CARİLER
              </button>
            </div>
            
            <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-premium min-h-[400px]">
              {detailsTab === 'staff' ? (
                <StaffList departmentId={viewingDepartment.id} />
              ) : (
                <DepartmentPartiesList departmentId={viewingDepartment.id} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in flex flex-col gap-8">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <FiUsers /> ORGANİZASYON ŞEMASI
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-on-surface">
            Şirket <span className="text-primary">Departmanları</span>
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
                onClick={() => setFilterTab(tab.id)}
                className={`h-9 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition-colors ${
                  filterTab === tab.id ? 'bg-white text-primary shadow-premium' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <button className="h-12 px-6 bg-primary text-white rounded-2xl font-black text-sm shadow-premium flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-colors" onClick={() => {
            openCreate('department', { onSuccess: handleFormSuccess });
          }}>
            <FiPlus size={20} /> Yeni Departman
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
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
          renderExtraActions={(d) => (
            <button 
              onClick={() => setViewingDepartment(d)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-primary/10 text-slate-400 hover:text-primary"
              title="Görüntüle"
            >
              <FiEye size={14} />
            </button>
          )}
          getRowOpacity={(d) => d.state === 0 ? 0.5 : 1}
          
          search={searchTerm}
          onSearchChange={(val) => setSearchTerm(val)}
          total={paginationMeta.total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          placeholder="Departman adı, kod veya açıklama ile ara..."
        />
      </div>
    </div>
  );
}