import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesAPI } from '../../services/api';
import { 
  FiEdit2, FiShield, FiPlus, FiCheckCircle, FiLock, 
  FiActivity, FiGrid, FiX, FiFilter, FiArchive
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { DataTable, Column } from '../../components/common/DataTable';
import { Role, Permission } from '../../types';
import { useSort } from '../../hooks/useSort';
import { useDeferredValue } from 'react';
import { queryKeys } from '../../services/queryKeys';

export function RolesPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;
  const searchTerm = searchParams.get('q') || '';
  const filterTab = (searchParams.get('tab') as 'active' | 'passive' | 'all') || 'all';
  const limit = Number(searchParams.get('limit')) || 100;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const deferredSearch = useDeferredValue(searchTerm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', permissionIds: [] as number[] });

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

  const sort = {
    key: searchParams.get('sortBy') || 'name',
    order: (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'ASC'
  };

  const { data: rolesData, isLoading: loading } = useQuery({
    queryKey: queryKeys.roles.all({ search: deferredSearch, filterTab, page, limit, sort }),
    queryFn: async ({ signal }) => {
      const state = filterTab === 'active' ? 1 : filterTab === 'passive' ? 0 : undefined;
      const res = await rolesAPI.getAll({ 
        limit, page, search: deferredSearch, state,
        sortBy: sort.key, sortOrder: sort.order
      }, { signal });
      return res.data;
    }
  });

  const roles = rolesData?.data || [];
  const paginationMeta = rolesData?.meta || { total: 0, page: 1, limit: 100, totalPages: 0 };
  
  const { sortedData, sortConfigs, toggleSort } = useSort<Role>(
    roles, 
    [{ key: sort.key, direction: sort.order.toLowerCase() as 'asc' | 'desc' }],
    (configs) => {
      if (configs.length > 0) {
        updateParams({ 
          sortBy: configs[0].key, 
          sortOrder: configs[0].direction.toUpperCase(),
          page: 1 
        });
      }
    }
  );

  const { data: allPermissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: async ({ signal }) => {
      const res = await rolesAPI.getPermissions({ limit: 500 }, { signal });
      return res.data.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: number | null; data: { name: string; permissionIds: number[] } }) => {
      const payload = { ...data, permissionIds: data.permissionIds.map(Number) };
      if (id) return rolesAPI.update(id, payload);
      return rolesAPI.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all({}) });
      setIsModalOpen(false);
      toast.success("Rol başarıyla kaydedildi.");
    },
    onError: () => toast.error("Hata oluştu")
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ id: editingId, data: formData });
  };

  const handleEdit = (role: Role) => {
    setEditingId(role.id);
    setFormData({
      name: role.name || '',
      permissionIds: role.permissions?.map((p: Permission) => p.id) ||[]
    });
    setIsModalOpen(true);
  };

  const toggleMutation = useMutation({
    mutationFn: ({ id, state }: { id: number; state: number }) => rolesAPI.toggleState(id, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all({}) });
      toast.success("Durum güncellendi.");
    },
    onError: () => toast.error("Hata oluştu")
  });

  const toggleState = (id: number, currentState: number) => {
    toggleMutation.mutate({ id, state: currentState });
  };

  const togglePermission = (permId: number) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permId)
        ? prev.permissionIds.filter(id => id !== permId)
        : [...prev.permissionIds, permId]
    }));
  };

  const applyFastRole = (type: string) => {
    if (type === 'all') {
      setFormData(prev => ({ ...prev, permissionIds: allPermissions.map((p: Permission) => p.id) }));
    } else if (type === 'view') {
      setFormData(prev => ({ 
        ...prev, 
        permissionIds: allPermissions
          .filter((p: Permission) => p.action === 'read')
          .map((p: Permission) => p.id) 
        }));
    } else if (type === 'clear') {
      setFormData(prev => ({ ...prev, permissionIds: [] }));
    }
  };

  const moduleTranslations: Record<string, string> = {
    'inventory': 'Stok ve Envanter',
    'users': 'Kullanıcılar',
    'roles': 'Roller ve Yetkiler',
    'departments': 'Departmanlar',
    'parties': 'Cariler (Müşteri/Tedarikçi)',
    'sales': 'Satış Yönetimi',
    'finance': 'Finansal Hareketler',
    'production': 'Üretim Planlama',
    'system': 'Sistem Konfigürasyonu'
  };

  const groupedPermissions = allPermissions.reduce((acc: Record<string, Permission[]>, perm: Permission) => {
    const rawMod = (perm.module || 'Genel').toLowerCase();
    const mod = moduleTranslations[rawMod] || perm.module || 'Genel';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {});

  const columns: Column<Role>[] = [
    { 
      header: 'YETKİ PROFİLİ', 
      accessor: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg font-black uppercase">
            <FiShield />
          </div>
          <div>
            <div className="font-black text-on-surface text-sm tracking-tighter uppercase">{r.name}</div>
            <div className="text-[10px] text-slate-400 font-bold tracking-widest flex items-center gap-2">
              İD: #{r.id} {r.state === 0 && <span className="text-danger font-black uppercase tracking-widest text-[8px] bg-danger/5 px-1.5 py-0.5 rounded-md">• PASİF</span>}
            </div>
          </div>
        </div>
      ),
      sortKey: 'name'
    },
    { 
      header: 'İZİN MATRİSİ', 
      accessor: (r) => (
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-lg bg-surface-container text-secondary text-[11px] font-black uppercase shadow-sm border border-slate-100 italic tabular-nums">
            {r.permissions?.length || 0}
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AKTİF YETKİ</span>
        </div>
      )
    },
    { 
      header: 'ERİŞİM DURUMU', 
      accessor: (r) => (
        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
          r.state === 1 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
        }`}>
          {r.state === 1 ? 'TAM ERİŞİM' : 'KISITLI / PASİF'}
        </span>
      ),
      sortKey: 'state'
    }
  ];

  return (
    <div className="animate-in flex flex-col gap-8">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-danger/10 text-danger px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <FiLock /> GÜVENLİK VE ERİŞİM
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-on-surface">
            Kullanıcı <span className="text-primary">Rol & Yetkileri</span>
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex bg-surface-container-low p-1 rounded-2xl border border-surface-container">
            {[
              { id: 'all', label: 'Tümü', icon: <FiFilter /> },
              { id: 'active', label: 'Aktif', icon: <FiActivity /> },
              { id: 'passive', label: 'Pasif', icon: <FiArchive /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`h-9 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition-colors ${
                  filterTab === tab.id ? 'bg-white text-primary shadow-premium' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.icon} {tab.label.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="h-12 px-6 bg-primary text-white rounded-2xl font-black text-sm shadow-premium flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-colors" onClick={() => {
            setEditingId(null); setFormData({ name: '', permissionIds:[] }); setIsModalOpen(true);
          }}>
            <FiPlus size={20} /> Yeni Rol Tanımla
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <DataTable<Role>
          data={sortedData}
          columns={columns}
          isLoading={loading}
          sortConfigs={sortConfigs}
          onSort={toggleSort}
          getRowKey={(r) => r.id}
          hasState={(r) => r.state === 1}
          onEdit={handleEdit}
          onArchive={(r) => toggleState(r.id, 1)}
          onRestore={(r) => toggleState(r.id, 0)}
          getRowOpacity={(r) => r.state === 0 ? 0.5 : 1}
          
          total={paginationMeta.total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          placeholder="Rol adı ile ara..."
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white max-w-[1000px] w-full p-6 rounded-2xl shadow-premium-lg border border-slate-100 flex flex-col gap-8 animate-in zoom-in-95 duration-300 relative max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {editingId ? 'Rol Revizyonu' : 'Yeni Güvenlik Profili'}
              </h2>
              <button 
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 transition-colors" 
                onClick={() => setIsModalOpen(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-8 overflow-y-auto pr-4 modern-scrollbar">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ROL İSMİ (GÖREV TANIMI)</label>
                <input 
                  required 
                  className="h-14 px-5 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors uppercase" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value.toLocaleUpperCase('tr-TR')})} 
                  placeholder="ÖR: MUHASEBE VE FİNANS MÜDÜRÜ" 
                />
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-1">
                  <label className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <FiGrid /> YETKİ MATRİSİ (CAPABILITY MATRIX)
                  </label>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">HIZLI ŞABLON:</span>
                    <button type="button" onClick={() => applyFastRole('all')} className="h-9 px-4 bg-primary/10 text-primary font-black text-[10px] sm:text-xs uppercase tracking-widest rounded-xl hover:bg-primary/20 hover:scale-105 active:scale-95 transition-all">
                      Süper Admin
                    </button>
                    <button type="button" onClick={() => applyFastRole('view')} className="h-9 px-4 bg-secondary/10 text-secondary font-black text-[10px] sm:text-xs uppercase tracking-widest rounded-xl hover:bg-secondary/20 hover:scale-105 active:scale-95 transition-all">
                      Sadece Görüntüleme
                    </button>
                    <button type="button" onClick={() => applyFastRole('clear')} className="h-9 px-4 bg-slate-100 text-slate-500 font-black text-[10px] sm:text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 hover:text-danger hover:scale-105 active:scale-95 transition-all">
                      Temizle
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                  {Object.keys(groupedPermissions).map(moduleName => (
                    <div key={moduleName} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                        <div className="text-[10px] font-black text-primary uppercase tracking-widest">
                          {moduleName}
                        </div>
                        <label className="flex items-center gap-1.5 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="hidden"
                            checked={groupedPermissions[moduleName].every((p: Permission) => formData.permissionIds.includes(p.id))}
                            onChange={(e) => {
                              const modulePermIds = groupedPermissions[moduleName].map((p: Permission) => p.id);
                              if (e.target.checked) {
                                setFormData(prev => ({ ...prev, permissionIds: Array.from(new Set([...prev.permissionIds, ...modulePermIds])) }));
                              } else {
                                setFormData(prev => ({ ...prev, permissionIds: prev.permissionIds.filter(id => !modulePermIds.includes(id)) }));
                              }
                            }}
                          />
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            groupedPermissions[moduleName].every((p: Permission) => formData.permissionIds.includes(p.id)) ? 'bg-primary border-primary text-white' : 'border-slate-200 bg-white group-hover:border-primary/50'
                          }`}>
                            {groupedPermissions[moduleName].every((p: Permission) => formData.permissionIds.includes(p.id)) && <FiCheckCircle size={10} />}
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase select-none">Tümü</span>
                        </label>
                      </div>
                      <div className="flex flex-col gap-2">
                        {groupedPermissions[moduleName].map((perm: Permission) => (
                          <label key={perm.id} className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors hover:bg-slate-50 group ${
                            formData.permissionIds.includes(perm.id) ? 'bg-primary/[0.03] ring-1 ring-primary/10' : ''
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                                formData.permissionIds.includes(perm.id) ? 'bg-primary border-primary text-white scale-110' : 'border-slate-200 bg-white group-hover:border-primary/50'
                              }`}>
                                <input 
                                  type="checkbox" 
                                  className="hidden"
                                  checked={formData.permissionIds.includes(perm.id)} 
                                  onChange={() => togglePermission(perm.id)} 
                                />
                                {formData.permissionIds.includes(perm.id) && <FiCheckCircle size={12} />}
                              </div>
                              <span className={`text-[13px] font-bold select-none ${
                                formData.permissionIds.includes(perm.id) ? 'text-slate-900' : 'text-slate-500'
                              }`}>
                                {perm.name}
                              </span>
                            </div>
                            
                            {perm.action && (
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                                perm.action === 'manage' ? 'bg-purple-100 text-purple-700' :
                                perm.action === 'delete' ? 'bg-red-100 text-red-700' :
                                perm.action === 'update' ? 'bg-blue-100 text-blue-700' :
                                perm.action === 'create' ? 'bg-green-100 text-green-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {perm.action}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 sticky bottom-0 bg-white pt-4 pb-2">
                <button type="submit" className="flex-1 h-16 rounded-2xl bg-primary text-white font-black text-base shadow-xl shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-colors">
                  YARATILAN PROFİLİ KAYDET
                </button>
                <button type="button" className="flex-[0.3] h-16 rounded-2xl bg-slate-50 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-colors" onClick={() => setIsModalOpen(false)}>
                  VAZGEÇ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}